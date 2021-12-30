const pool = require("./database");
const {getCurrentDate} = require("./userRequests");
const axios = require("axios");
const fs = require('fs');
const {order} = require("../controller/orderController");


async function createOrder(jsonOrder,user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("creating order");
        let id = makeid(16);
        const res = await conn.query("INSERT INTO orders value (?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [id,user_id, getTotal(jsonOrder),jsonOrder.adress,
                jsonOrder.products
                ,jsonOrder.phone,getCurrentDate(),'undefined','validation','undefined','','','','','']);
        await setCoordonates(jsonOrder.adress,id);
        await conn.query("UPDATE users SET orderid = ? WHERE user_id= ?", [id,user_id]);
        console.log(res);
        _then(id);
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
        console.log("make query")
        console.log(order_id)
        const rows = await conn.query("SELECT COUNT(1) FROM `orders` WHERE id=?", [order_id]);
        let number = rows[0]["COUNT(1)"]
        if(number === 0){
            console.log("order undefined")
            _then(false);
        }
        else{
            console.log("order defined")
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
        console.log("make query")
        const rows = await conn.query("SELECT * FROM `orders` WHERE id=?", [order_id]);
        let data = rows[0]
        console.log(data);
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
        console.log("make query coursier")
        console.log(order_id)
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
        console.log("make queryy")
        const rows = await conn.query("SELECT * FROM `orders` WHERE status!='canceled' AND status!='delivered' ");
        let data = rows
        delete data['meta']
        console.log(data);
        _then(data);
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
        console.log("make query")
        await conn.query("UPDATE `orders` SET `status`=? WHERE id=?", [status,order_id]);

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
        console.log("make query")
        fetchPath(pos1,pos2, (data) => {
            console.log("got geopath")
            console.log(data.features[0].geometry.coordinates)
            console.log(data.features[0].properties.segments[0].duration)
            console.log(data.features[0].properties.segments[0].distance)
            fs.readFile('paths.json', function readFileCallback(err, jsonData) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Writting in file")
                    let obj = JSON.parse(jsonData);
                    console.log(obj)
                    obj[orderid] = data.features[0].geometry.coordinates
                    let json = JSON.stringify(obj);
                    console.log(obj)

                    fs.writeFile('paths.json', json,function(err, result) {
                        if(err) console.log('error', err);
                    });
                    console.log("File written")

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
    console.log('get coordonates')
    uri = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?country=FR&access_token=pk.eyJ1IjoianNjYXN0cm8iLCJhIjoiY2s2YzB6Z25kMDVhejNrbXNpcmtjNGtpbiJ9.28ynPf1Y5Q8EyB_moOHylw`
    axios.get(uri)
        .then((response) => {
            console.log("coordonates gotten")
            console.log(response.data.features[0].center)
            _callback(response.data.features[0].center)
        })
        .catch((error) => console.log(error.response));
}
async function setCoordonates(string,orderid){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Setting coordonates")
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
        console.log("make query")
        await conn.query("UPDATE `orders` SET `ranking`=? WHERE id=?", [ranking,order_id]);
        await conn.query("UPDATE `orders` SET `message`=? WHERE id=?", [message,order_id]);

    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
//need to be done
function getTotal(jsonObject){
    return 0
}

module.exports = { createOrder,orderExist ,getTotal, getOrder,changeStatus,getAllAvaibleOrders,selectCoursier,setRanking,fetchPath,setGeoPath};