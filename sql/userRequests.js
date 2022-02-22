const pool = require("./database");
const {getCodes} = require("../sql/productRequests");
let whitelist

async function createUser(user_id){
    let conn;
    try {
        conn = await pool.getConnection();
        let date = getCurrentDate() + 1000*60*60;
        console.log("in database")
        await conn.query("INSERT INTO users value (?,?,?,?,?,?)", [user_id,date,date,'undefined','','customer']);
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
        const rows = await conn.query("SELECT COUNT(1) FROM `users` WHERE user_id=?", [user_id]);
        let number = rows[0]["COUNT(1)"]
        await conn.query("UPDATE users SET user_lastconnection = ? WHERE user_id= ?", [getCurrentDate(),user_id]);
        await updateUserOrderID(user_id);
        if(number === 0){
            _then(false,'undefined');
        }
        else{
            const userdata = await conn.query("SELECT orderid,privilege,codes FROM `users` WHERE user_id=?", [user_id]);
            _then(true,userdata[0].orderid,userdata[0].privilege,userdata[0].codes);
        }
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function getUserOrder(user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        await updateUserOrderID(user_id,(exist) => {
            if(!exist)
                _then('undefined');
            else{
                const rows = conn.query("SELECT orderid FROM `users` WHERE user_id=?", [user_id]);
                _then(rows[0].orderid);
            }
        })
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function getPrivilege(user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT privilege FROM `users` WHERE user_id=?", [user_id]);
        _then(rows[0].privilege)
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function getCodesFromDB(user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT codes FROM `users` WHERE user_id=?", [user_id]);
        _then(rows[0].codes)
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function removeOrderId(user_id){
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("UPDATE `users` SET `orderid`='undefined' WHERE user_id=?", [user_id]);
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}

async function updateUserOrderID(user_id,_then){
    let conn;
    try {
    conn = await pool.getConnection();

    const number = await conn.query("SELECT COUNT(1) FROM `orders` WHERE (user_id=? AND status!='canceled' AND status!='delivered')", [user_id]);
    let n = number[0]["COUNT(1)"]
    if(n === 0){
        await conn.query("UPDATE users SET orderid = ? WHERE user_id= ?", ['undefined',user_id]);
        _then(false)
    }
    else{
        _then(true)
    }
    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
async function addPromotionCode(code,user_id,_then){
    let conn;
    try {
        conn = await pool.getConnection();

        const codes = getCodes();
        let exist = false
        let notinuser = true
        let codexpired = false
        codes.map((c) => {
            if(c.name === code && c.disponible === 1){
                exist = true
                let expiration = new Date(c.expiration);
                let now = new Date();
                if(expiration.getTime() < now.getTime() || c.quantity < 1){
                    codexpired = true
                }
            }
        })

        if(exist && !codexpired){
            const usercodes = await conn.query("SELECT codes FROM `users` WHERE user_id=?", [user_id]);
            let newcodes;
            if( usercodes[0].codes === ''){
                newcodes = code
            }
            else{
                usercodes[0].codes.split(',').map((c) => {
                    if(c === code){
                        notinuser = false
                    }
                })
                newcodes = usercodes[0].codes + "," + code;
            }
            if(notinuser){
                await conn.query("UPDATE users SET codes = ? WHERE user_id= ?", [newcodes ,user_id]);
                await conn.query("UPDATE codes SET quantity = quantity -1  WHERE name= ?", [code]);

            }

        }
        if(!exist){
            _then(408)

        }
        else if(codexpired){
            _then(418)
        }
        else if(!notinuser){
            _then(409)
        }
        else{
            _then(200)
        }

    } catch (err) {
        throw err;
    } finally {
        if (conn) return conn.end();
    }
}
function getCurrentDate(){
    let today = new Date();
    let date = today.getDate() +'-'+(today.getMonth()+1)+'-'+ today.getFullYear();
    let time = parseInt(today.getHours() + "1" ) + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date+' '+time;
}
function getWhitelist(){
    return whitelist
}
function setWhitelist(w){
    whitelist = w;
}
module.exports = { userExist, createUser,getCurrentDate ,getUserOrder,updateUserOrderID,getPrivilege,removeOrderId,getCodesFromDB, addPromotionCode,setWhitelist,getWhitelist};
