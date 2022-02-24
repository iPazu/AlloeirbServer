const {userExist, getUserOrder} = require("../sql/userRequests");
const orderRequests = require('../sql/orderRequest')
const userRequests = require('../sql/userRequests')
const {getCoursierLocation} = require("./adminController");
const fs = require('fs');
const {getMaxOrders, getRunningOrderNumber, setRunningOrderNumber} = require("../sql/productRequests");



module.exports.order = async (req,res) => {

    if(req.user_id){
        await userExist(req.user_id,(exist) =>{
            if(exist){
                getUserOrder(req.user_id,(orderid) => {
                    if(orderid === 'undefined'){
                        if(getRunningOrderNumber() >= getMaxOrders()){
                            res.sendStatus(509);
                            return
                        }
                        orderRequests.createOrder(req.body,req.user_id,(id) =>{
                            res.send(id);
                            res.sendStatus(200);
                        })
                    }else{
                        res.sendStatus(609);

                    }
                })

            }
            else {
                res.sendStatus(400);
            }
        })
    }
    else{
        res.sendStatus(400);
    }
}


module.exports.fetchOrder = async (req,res) => {
    let order_id = req.params.orderid;
    await orderRequests.orderExist(order_id, (exist) => {
        if (exist) {
            orderRequests.getOrder(order_id, (data) => {
                if(data.user_id === req.user_id){ //Change this to allow admin and coursier
                    if(data.status === 'delivering'){
                        data['coursierpos'] = [getCoursierLocation()[data.coursier]]
                            getGeoJSON(data.id, (geojson) => {
                                data['geojsonPath'] = geojson
                                res.send(data)
                            })
                    }
                    else
                        res.send(data)

                }else{
                    res.sendStatus(400);
                }
            })
        } else {
            res.sendStatus(400);
        }
    })
};

module.exports
module.exports.cancelOrder = async (req,res) => {
    let order_id = req.params.orderid;
    await orderRequests.orderExist(order_id, (exist) => {
        if (exist) {
            orderRequests.getOrder(order_id, (data) => {
                if(data.user_id === req.user_id){ //Change this to allow admin and coursier
                        orderRequests.changeStatus("canceled",order_id);

                        userRequests.updateUserOrderID(req.user_id);
                        setRunningOrderNumber(getRunningOrderNumber()-1)
                        res.sendStatus(200)
                }else{
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
    await orderRequests.orderExist(order_id, (exist) => {
        if (exist) {
            orderRequests.getOrder(order_id, (data) => {
                if(data.user_id === req.user_id){ //Change this to allow admin and coursier
                    if(data.status === "ranking"){
                        orderRequests.changeStatus("delivered",order_id);
                        orderRequests.setRanking(req.body.ranking,req.body.message,order_id);
                         userRequests.removeOrderId(req.user_id);
                        res.sendStatus(200)
                    }
                    else {
                        res.sendStatus(400);
                    }
                }else{
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
            let obj = JSON.parse(jsonData);
            _callback(obj[orderid])
        }
    });
}
