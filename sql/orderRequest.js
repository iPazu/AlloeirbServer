const pool = require("./database");
const {getCurrentDate, getCodesFromDB} = require("./userRequests");
const axios = require("axios");
const fs = require('fs');
const {getProducts, setRunningOrderNumber, getRunningOrderNumber, getCodes} = require("./productRequests");


async function createOrder(jsonOrder,user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        let id = makeid(16);
        getTotal(jsonOrder.products,user_id,(total)=> {
            console.log("from func")
            console.log(total)
            const res =  conn.query("INSERT INTO orders value (?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [id,user_id,jsonOrder.firstname,jsonOrder.lastname, total,jsonOrder.adress,
                    jsonOrder.products,jsonOrder.description
                    ,jsonOrder.phone,getCurrentDate(),'undefined','validation','undefined','','','','','']);
             setCoordonates(jsonOrder.adress,id);
             conn.query("UPDATE users SET orderid = ? WHERE user_id= ?", [id,user_id]);
            setRunningOrderNumber(getRunningOrderNumber()+1)
            _then(id);
        })

    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

function makeid(length) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}


async function orderExist(order_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT COUNT(1) FROM `orders` WHERE id=?", [order_id]);
        let number = rows[0]["COUNT(1)"]
        if(number === 0){
            _then(false);
        }
        else{
            _then(true);
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function getOrder(order_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM `orders` WHERE id=?", [order_id]);
        let data = rows[0]
        _then(data);
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function selectCoursier(user_id,order_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE `orders` SET `status`='delivering' WHERE id=?", [order_id]);
        await conn.query("UPDATE `orders` SET `coursier`=? WHERE id=?", [user_id,order_id]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function getAllAvaibleOrders(_then){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM `orders` WHERE status!='canceled' AND status!='delivered' AND status!='ranking'");
        let data = rows
        delete data['meta']
        _then(data);
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function getRunningOrder(_then){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT COUNT(1) FROM `orders` WHERE status='delivering' OR status='validation' OR status='preparing'");
        let number = rows[0]["COUNT(1)"]
        _then(number);
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function changeStatus(status,order_id){
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE `orders` SET `status`=? WHERE id=?", [status,order_id]);

    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function updateStock(productdata){
    let conn;
    try {
        console.log("updating stock")
        console.log(productdata)
        conn = await pool.getConnection();
        productdata.split(",").map((p)=> {
            p = p.replace("{","")
            p = p.replace("}","")
            p = p.replaceAll('"',"")
            p = p.split(":")
            let id = p[0]
            let quantity = p[1]
            console.log(id)
            console.log(quantity)
             conn.query("UPDATE `products` SET stock= stock - ? WHERE id=?", [quantity,id]);
        })

    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function setGeoPath(pos1,pos2,orderid){
    let conn;
    try {
        conn = await pool.getConnection();
        fetchPath(pos1,pos2, (data) => {
            fs.readFile('paths.json', function readFileCallback(err, jsonData) {
                if (err) {
                } else {
                    let obj = JSON.parse(jsonData);
                    obj[orderid] = data.features[0].geometry.coordinates
                    let json = JSON.stringify(obj);

                    fs.writeFile('paths.json', json,function(err, result) {
                        if(err) console.log('error', err);
                    });

                }
            });
             conn.query("UPDATE `orders` SET `deliveryTime`=? WHERE id=?", [data.features[0].properties.segments[0].duration,orderid]);
             conn.query("UPDATE `orders` SET `distance`=? WHERE id=?", [data.features[0].properties.segments[0].distance,orderid]);
        })


    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
function fetchPath(pos1,pos2,_callback){
    const config = {
        headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
        },
    };
    let pos1s = pos1.longitude +","+ pos1.latitude;
    let pos2s = pos2.longitude +","+ pos2.latitude;
    uri = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248b6a8d55e0873484e9fdfce09ec950e99&start=${pos1s}&end=${pos2s}`
    axios.get(uri, config)
        .then((response) => _callback(response.data))
        .catch((error) => console.log(error.response));
}


function getCoordonatesFromString(string,_callback){
    location = string.replace(" ","%20")
    uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?country=FR&access_token=pk.eyJ1IjoianNjYXN0cm8iLCJhIjoiY2s2YzB6Z25kMDVhejNrbXNpcmtjNGtpbiJ9.28ynPf1Y5Q8EyB_moOHylw`
    axios.get(uri)
        .then((response) => {
            _callback(response.data.features[0].center)
        })
        .catch((error) => console.log(error.response));
}
async function setCoordonates(string,orderid){
    let conn;
    try {
        conn = await pool.getConnection();
        getCoordonatesFromString(string,(position) => {
             conn.query("UPDATE `orders` SET `latitude`=? WHERE id=?", [position[1],orderid]);
             conn.query("UPDATE `orders` SET `longitude`=? WHERE id=?", [position[0],orderid]);
        })
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function setRanking(ranking,message,order_id){
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE `orders` SET `ranking`=? WHERE id=?", [ranking,order_id]);
        await conn.query("UPDATE `orders` SET `message`=? WHERE id=?", [message,order_id]);

    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
//need to be done
async function getTotal(jsonObject,user_id,_then){
    let products  = getProducts()
    let total = 0.0;
    for(productid in jsonObject){
        for (let key in products) {
            if(products[key].id === productid){
               total+= products[key].unit_price*jsonObject[productid]
            }
        }
    }
    console.log("fetching codes")
    let reduction = 0
    getCodesFromDB(user_id,(codes) => {
        console.log(codes)
        let codeData = getCodes()
        console.log(getCodes())
        codes.map((c)=>{
            codeData.map((cd)=>{
                if(cd.name === c){
                    if(reduction < cd.reduction)
                        reduction = cd.reduction
                }

            })
        })

        console.log(reduction)
        console.log(total)
        if(reduction>0){
            _then(total*(reduction/100))
        }
        else{
            _then(total)
        }
    })


}

module.exports = { createOrder,orderExist ,getTotal, getRunningOrder,getOrder,changeStatus,getAllAvaibleOrders,selectCoursier,setRanking,fetchPath,setGeoPath,updateStock};
