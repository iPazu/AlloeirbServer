
const orderRequests = require('../sql/orderRequest')
const userRequests = require('../sql/userRequests')
const {order} = require("./orderController");
const {setRunningOrderNumber, getRunningOrderNumber} = require("../sql/productRequests");

let coursierLocation = {alaboirie: {latitude:qg['alex'][1],longitude:qg['alex'][0]},
    tlemestre: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    nkegltourne: {latitude:qg['antoinelh'][1],longitude:qg['antoinelh'][0]},
    tgaignard001: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    dwalther: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    csammou: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    mgibelin: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    cdu: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    gbaratange: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    mmezencev: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    dbritelle: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    aboucher007: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    aclochard: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    alhonora: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    mhelias004: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    vajoly: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    ivasseur: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    tfacen: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    zbachelier: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    hcherifiala: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    alaurent026: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    luchaussat: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    llefebvre011: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    eroncin: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    plarue: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    mrozec001: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    aaugerat: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    tcilona: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},
    alducq: {latitude:qg['antoinelh'][1],longtitude:qg['antoinelh'][0]},




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
            //console.log("updating coursize location")
            console.log(req.body)

            let position = req.body.pos
            let id = position.id.replaceAll('"',"")
            id = id.replaceAll("'","")
            id = id.replaceAll("'","")
            id = id.replaceAll(" ","")
            coursierLocation[id] = {latitude: position.latitude,longitude: position.longitude}
           // console.log(coursierLocation)
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
                coursierLocation[req.user_id] = [-0.6015,44.8215]
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
