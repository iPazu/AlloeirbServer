
const orderRequests = require('../sql/orderRequest')
const userRequests = require('../sql/userRequests')
let coursierLocation = {}

async function checkPrivilege(req,_then){
    if(req.session.user_id){
        console.log("Fetching orders")
        await userRequests.getPrivilege(req.session.user_id, (privilege) => {
            console.log(privilege)
            if (privilege === 'coursier' || privilege === 'admin') {
                console.log("Right privileges");
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
    await checkPrivilege(req,(privilege) => {
        if(privilege){
            coursierLocation[req.session.user_id] = req.body
        }
        else {
            res.sendStatus(400)
        }
    })
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
            console.log("Accepting order");
            console.log(order_id)
            orderRequests.orderExist(order_id, (exist) => {
                console.log(exist)
                if (exist) {
                    console.log("Order exist")
                    orderRequests.getOrder(order_id, (data) => {
                            console.log("User match with order");
                            if(data.status === "validation"){
                                orderRequests.changeStatus("preparing",order_id);
                                console.log("Successfuly changed status");
                                res.sendStatus(200)
                            }
                            else {
                                console.log("Status not valid");
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
            let order_id = req.params.orderid;
            console.log("Accepting coursier");
            console.log(order_id)
            orderRequests.orderExist(order_id, (exist) => {
                console.log(exist)
                if (exist) {
                    console.log("Order exist")
                    orderRequests.getOrder(order_id, (data) => {
                            console.log("User match with order");
                            if(data.status === "preparing"){
                                orderRequests.selectCoursier(req.session.user_id,order_id);
                                console.log("Successfuly changed coursier");
                                res.sendStatus(200)
                            }
                            else {
                                console.log("Status not valid");
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
            console.log("Delivered");
            console.log(order_id)
            orderRequests.orderExist(order_id, (exist) => {
                console.log(exist)
                if (exist) {
                    console.log("Order exist")
                    orderRequests.getOrder(order_id, (data) => {
                        if(data.status === "delivering"){
                            orderRequests.changeStatus('ranking',order_id);
                            console.log("Successfuly delivered");
                            res.sendStatus(200)
                        }
                        else {
                            console.log("Status not valid");
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