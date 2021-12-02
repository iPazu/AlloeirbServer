const pool = require("./database");

async function createUser(user_id){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("creating user");
        const res = await conn.query("INSERT INTO users value (?, ?,?,?)", [user_id, "0",'now','before']);
        console.log(res);
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function userExist(user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("make query")
        console.log(user_id)
        const rows = await conn.query("SELECT COUNT(1) FROM `users` WHERE user_id=?", [user_id]);
        let number = rows[0]["COUNT(1)"]
        if(number === 0){
            console.log("undefined")
            _then(false);
        }
        else{
            console.log("defined")
            _then(true);
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

module.exports = { userExist, createUser };
