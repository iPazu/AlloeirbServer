const pool = require("./database");


 let lastProductsState = {}

async function updateProductsFromDB(_then){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Fetching products")
        let data = await conn.query("SELECT * FROM `products` WHERE disponible=1")
        delete data['meta']
        lastProductsState = data;
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
module.exports = { updateProductsFromDB, getProducts};
