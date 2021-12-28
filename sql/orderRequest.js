const pool = require("./database");
const {getCurrentDate} = require("./userRequests");


async function createOrder(jsonOrder,user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("creating order");
        let id = makeid(16);
        const res = await conn.query("INSERT INTO orders value (?, ?,?,?,?,?,?,?,?,?,?)",
            [id,user_id, getTotal(jsonOrder),jsonOrder.adress,
                jsonOrder.products
                ,jsonOrder.phone,getCurrentDate(),'undefined','validation','undefined','']);
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

module.exports = { createOrder,orderExist ,getTotal, getOrder,changeStatus,getAllAvaibleOrders,selectCoursier,setRanking};
