
const orderRequests = require('../sql/orderRequest')
const userRequests = require('../sql/userRequests')
const {order} = require("./orderController");
const {setRunningOrderNumber, getRunningOrderNumber} = require("../sql/productRequests");
let qg = { alex:[ -0.6303,44.8108],noemie:[-0.5802,44.8056],alice:[ -0.5712,44.8389],dimitri:[ -0.5788,44.8234],antoinelh:[-0.6015,44.8215],theolm:[  -0.6031,44.8071]}

let coursierLocation = {alaboirie: {latitude:qg['alex'][1],longitude:qg['alex'][0]},
    nkegltourne: {latitude:qg['noemie'][1],longtitude:qg['noemie'][0]},
    mrozec001: {latitude:qg['noemie'][1],longitude:qg['noemie'][0]},
    tlemestre: {latitude:qg['theolm'][1],longtitude:qg['noemie'][0]},
    tgainard001: {latitude:qg['alex'][1],longtitude:qg['alex'][0]},
    tfacen: {latitude:qg['alex'][1],longtitude:qg['alex'][0]},
    dwalther: {latitude:qg['dimitri'][1],longtitude:qg['dimitri'][0]},
    iboukhars: {latitude:qg['alex'][1],longtitude:qg['alex'][0]}


}

async function checkPrivilege(req,_then){
    if(req.user_id){
        await userRequests.getPrivilege(req.user_id, (privilege) => {
            if (privilege === 'coursier' || privilege === 'admin') {
                _then(true)
            } else {
                _then(false)
            }
        })
    }
    else
        _then(false)
}

module.exports.updateCoursierLocation = async (req,res) => {
    try {
        if(req.body.pos.key === "YfyguDreugUchcuHiv"){
            console.log("updating coursize location")
            console.log(req.body)
            let position = req.body.pos
            let id = position.id.replaceAll('"',"")
            id = id.replaceAll("'","")
            id = id.replaceAll("'","")
            id = id.replaceAll(" ","")
            coursierLocation[id] = {latitude: position.latitude,longitude: position.longitude}
            console.log(coursierLocation)
            res.sendStatus(200)
        }
    }catch (error){
         console.log(error)
    }


}
module.exports.fetchOrders = async (req,res) => {
    await checkPrivilege(req,(privilege) => {
        if(privilege){
            orderRequests.getAllAvaibleOrders( (data) => {
                res.send(data)
            })
        }
        else {
            res.sendStatus(400)
        }
    })
}


module.exports.acceptCommand = async (req,res) => {
    await checkPrivilege(req,(privilege) => {
        if(privilege){
            let order_id = req.params.orderid;
            orderRequests.orderExist(order_id, (exist) => {
                if (exist) {
                    orderRequests.getOrder(order_id, (data) => {
                            if(data.status === "validation"){
                                orderRequests.changeStatus("preparing",order_id);
                                orderRequests.getOrder(order_id,(data) => {
                                    console.log(data)
                                    orderRequests.updateStock(data.products)
                                })
                                res.sendStatus(200)
                            }
                            else {
                                res.sendStatus(400);
                            }
                        })
                } else {
                    res.sendStatus(400);
                }
            })
        }
        else {
            res.sendStatus(400)
        }
    });

};

module.exports.acceptCoursier = async (req,res) => {
    await checkPrivilege(req,(privilege) => {
        if(privilege){
            if(coursierLocation[req.user_id] === undefined){
                console.log(req.user_id)
                console.log("wrong status")
                res.sendStatus(407)
                return;
            }
            let order_id = req.params.orderid;
            orderRequests.orderExist(order_id, (exist) => {
                console.log("order exist")
                if (exist) {
                    orderRequests.getOrder(order_id, (data) => {
                        console.log("order fetched")
                        if(data.status === "preparing"){
                            console.log("order taken")
                            orderRequests.selectCoursier(req.user_id,order_id);
                                let deliverypos = {longitude: data.longitude, latitude: data.latitude}
                                orderRequests.setGeoPath(deliverypos,coursierLocation[req.user_id],data.id)
                                console.log("coursier taken")

                            res.sendStatus(200)
                            }
                            else {
                                res.sendStatus(400);
                            }
                        })
                } else {
                    res.sendStatus(400);
                }
            })
        }
        else {
            res.sendStatus(400)
        }
    });
}

module.exports.delivered = async (req,res) => {
    await checkPrivilege(req,(privilege) => {
        if(privilege){
            let order_id = req.params.orderid;
            orderRequests.orderExist(order_id, (exist) => {
                if (exist) {
                    orderRequests.getOrder(order_id, (data) => {
                        if(data.status === "delivering"){
                            setRunningOrderNumber(getRunningOrderNumber()-1)
                            orderRequests.changeStatus('ranking',order_id);
                            res.sendStatus(200)
                        }
                        else {
                            res.sendStatus(400);
                        }
                    })
                } else {
                    res.sendStatus(400);
                }
            })
        }
        else {
            res.sendStatus(400)
        }
    });
}

module.exports.getCoursierLocation = () => {
    return coursierLocation;
}