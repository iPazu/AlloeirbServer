
const orderRequests = require('../sql/orderRequest')
const userRequests = require('../sql/userRequests')
const {order} = require("./orderController");

let coursierLocation = {alaboirie: {latitude:43.66199693275686, longitude:1.480274969014603}}

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
        console.log(res.body)
    try {
        if(req.body.pos.key === "YfyguDreugUchcuHiv"){
            console.log("updating coursize location")
            console.log(req.body)
            let position = req.body.pos
            coursierLocation[position.id] = {latitude: position.latitude,longitude: position.longitude}
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
                res.sendStatus(407)
                return;
            }
            let order_id = req.params.orderid;
            orderRequests.orderExist(order_id, (exist) => {
                if (exist) {
                    orderRequests.getOrder(order_id, (data) => {
                            if(data.status === "preparing"){
                                orderRequests.selectCoursier(req.user_id,order_id);
                                let deliverypos = {longitude: data.longitude, latitude: data.latitude}
                                orderRequests.setGeoPath(deliverypos,coursierLocation[req.user_id],data.id)
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