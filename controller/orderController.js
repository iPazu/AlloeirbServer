const {userExist, getUserOrder} = require("../sql/userRequests");
const orderRequests = require('../sql/orderRequest')
const userRequests = require('../sql/userRequests')
const {getCoursierLocation} = require("./adminController");
const fs = require('fs');



module.exports.order = async (req,res) => {
    console.log("Recieving order")
    console.log(req.session.user_id)

    if(req.session.user_id){
        await userExist(req.session.user_id,(exist) =>{
            if(exist){
                console.log("User  exist")
                getUserOrder(req.session.user_id,(orderid) => {
                    console.log(orderid)
                    if(orderid === 'undefined'){
                        orderRequests.createOrder(req.body,req.session.user_id,(id) =>{
                            res.send(id);
                            res.sendStatus(200);
                        })
                    }else{
                        console.log("User already has order ")
                        res.sendStatus(400);
                    }
                })

            }
            else {
                console.log("User doesn't exist")
                res.sendStatus(400);
            }
        })
    }
    else{
        console.log("No session cookie")

        res.sendStatus(400);
    }
}


module.exports.fetchOrder = async (req,res) => {
    let order_id = req.params.orderid;
    console.log("Fetching order")
    await orderRequests.orderExist(order_id, (exist) => {
        console.log(exist)
        if (exist) {
            console.log("Order exist")
            orderRequests.getOrder(order_id, (data) => {
                if(data.user_id === req.session.user_id){ //Change this to allow admin and coursier
                    console.log("User match with order");
                    if(data.status === 'delivering'){
                        console.log("setting coursier position")
                        console.log(getCoursierLocation()[data.coursier])
                        data['coursierpos'] = [getCoursierLocation()[data.coursier]]
                            getGeoJSON(data.id, (geojson) => {
                                data['geojsonPath'] = geojson
                                console.log("sending data with path")
                                res.send(data)
                            })
                    }
                    else
                        res.send(data)

                }else{
                    console.log("User doesn't match with order");
                    res.sendStatus(400);
                }
            })
        } else {
            res.sendStatus(400);
        }
    })
};

module.exports.cancelOrder = async (req,res) => {
    let order_id = req.params.orderid;
    console.log("Canceling order");
    console.log(order_id)
    await orderRequests.orderExist(order_id, (exist) => {
        console.log(exist)
        if (exist) {
            console.log("Order exist")
            orderRequests.getOrder(order_id, (data) => {
                if(data.user_id === req.session.user_id){ //Change this to allow admin and coursier
                    console.log("User match with order");
                    if(data.status === "validation"){
                        orderRequests.changeStatus("canceled",order_id);
                        userRequests.updateUserOrderID(req.session.user_id);
                        console.log("Successfuly changed status");

                        res.sendStatus(400)
                    }
                    else {
                        console.log("Status not valid");
                        res.sendStatus(400);
                    }
                }else{
                    console.log("User doesn't match with order");
                    res.sendStatus(400);
                }
            })
        } else {
            res.sendStatus(400);
        }
    })
};

module.exports.rankOrder = async (req,res) => {
    let order_id = req.params.orderid;
    console.log(req.body.ranking)
    console.log("Ranking order");
    await orderRequests.orderExist(order_id, (exist) => {
        console.log(exist)
        if (exist) {
            console.log("Order exist")
            orderRequests.getOrder(order_id, (data) => {
                if(data.user_id === req.session.user_id){ //Change this to allow admin and coursier
                    console.log("User match with order");
                    if(data.status === "ranking"){
                        orderRequests.changeStatus("delivered",order_id);
                        orderRequests.setRanking(req.body.ranking,req.body.message,order_id);
                         userRequests.removeOrderId(req.session.user_id);
                        console.log("Successfuly set ranking");
                        res.sendStatus(200)
                    }
                    else {
                        console.log("Status not valid");
                        res.sendStatus(400);
                    }
                }else{
                    console.log("User doesn't match with order");
                    res.sendStatus(400);
                }
            })
        } else {
            res.sendStatus(400);
        }
    })
};

function getGeoJSON(orderid,_callback){
    fs.readFile('paths.json', function readFileCallback(err, jsonData) {
        if (err) {
            console.log(err);
        } else {
            console.log("Reading paths file")
            let obj = JSON.parse(jsonData);
            _callback(obj[orderid])
        }
    });
}
