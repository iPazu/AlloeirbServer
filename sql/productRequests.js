const pool = require("./database");


let lastProductsState = {}
let codesState = {}
let runningOrders = 0;

async function updateProductsFromDB(_then){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Fetching products")
        let data = await conn.query("SELECT * FROM `products` WHERE disponible=1 AND stock>0")
        delete data['meta']
        lastProductsState = data;
        _then(data)
    } catch (err) {
        return err;
    }finally {
        if (conn) return conn.end();
    }
}

async function updateCodesFromDB(_then){
    let conn;
    try {
        conn = await pool.getConnection();
        let data = await conn.query("SELECT * FROM `codes`")
        delete data['meta']
        codesState = data;
        _then(data)
    } catch (err) {
        return err;
    }finally {
        if (conn) return conn.end();
    }
}
function getProducts(){
     return lastProductsState;
}

function getCodes(){
    return codesState;
}
function getRunningOrderNumber(){
    return runningOrders
}
function setRunningOrderNumber(n){
     runningOrders = n
}
function getMaxOrders(){
    return process.env.MAX_ORDERS
}
module.exports = { updateProductsFromDB, getProducts,updateCodesFromDB,getCodes,getRunningOrderNumber,setRunningOrderNumber,getMaxOrders};
