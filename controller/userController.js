const fetch = require('node-fetch');
const userRequest = require('../sql/userRequests')
const {getProducts, getCodes} = require("../sql/productRequests");
const jwt = require("jsonwebtoken")
const {order} = require("./orderController");
const fs = require('fs');
const {use} = require("express/lib/router");
const csv = require('fast-csv');
const {getWhitelist} = require("../sql/userRequests");


module.exports.atemptAuthentification = async (req, res) => {
    console.log("auth")
    let castoken = req.params.token;
    let casticket = req.params.ticket;
    let firstname;
    console.log(castoken);
    console.log(casticket);
    let user_id = await getCasUserID(castoken, casticket)
    user_id ='alaboirie';
    getWhitelistInfo(user_id,(userinfo) => {
        console.log(typeof userinfo)
        let lastname =  String(userinfo).split(";")[0]
        let firstname = String(userinfo).split(";")[1]
        console.log(firstname)
        console.log(lastname)
        console.log("popoepoepeoep")
    const accessToken = jwt.sign(user_id,process.env.SECRET_TOKEN)
    //Initialise session
    let sess = req;
     userRequest.userExist(user_id, (exist,id,privilege,codes) => {
        if (!exist) {
            console.log("doesn't exist");
            userRequest.createUser(user_id)
        }
        console.log("user exist")
        sess.user_id = user_id;
        let orderid = id;
        console.log(id)
        let  codeObject = {}
        let allCodes = getCodes()
        codes.split(",").map(c => {
            allCodes.map(ac => {
                if(ac.name === c){
                    codeObject[c] = ac.reduction
                }
            })
        })
         console.log("eeeeee")
         console.log(firstname)
        res.send({user_id,firstname,orderid,privilege,codeObject,accessToken});
    });
    })

};

module.exports.fetchUserID = (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    console.log(token)
    if (token == null){
        res.send('undefined');
        return;
    }

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        console.log(err)
        if (err) {
            res.send('undefined');
            return;
        }
        console.log(user)
        res.send(user)
    })

};
module.exports.addCode = (req,res) => {
    console.log(req.params.code)
    let codetoadd = req.params.code
    userRequest.addPromotionCode(codetoadd,req.user_id, (status) => {
        console.log(status)
        let codes = getCodes()
        let reduction = 0
        codes.forEach()
        codes.map(c => {
            if(c.name === codetoadd){
                reduction = c.reduction
            }
        })
        if(status === 200){
            console.log({codetoadd: reduction})
            let codeObj = {}
            codeObj[codetoadd]  = reduction
            res.json(codeObj)
        }
        res.sendStatus(status)
    })
}
async function getCasUserID(token, ticket) {
    const url = `https://cas.bordeaux-inp.fr/serviceValidate?service=https://alaboirie.vvv.enseirb-matmeca.fr/redirectprod?token=${token}&ticket=${ticket}`;
    let data;
    await fetch(url)
        .then(response => response.text())
        .then(str => {
            data = str
        });
    data = data.substring(
        data.indexOf("cas:user>") + 1,
        data.lastIndexOf("</cas:user")
    );
    data = data.slice(8);
    console.log(data)
    return data;

}

module.exports.fetchProducts = async (req, res) => {
    console.log("Fetching products user")
    if(req.user_id){
        try {
            console.log("Sending products");
            let products = [...getProducts()];
            let usercode = null;
            userRequest.getCodesFromDB(req.user_id,(codes) => {
                usercode = codes;
            }).then( () => {
                products.map((p,index) => {
                    if(p.code !== ''){
                        let have = false;
                        usercode.split(',').map((c) => {
                            if(c === p.code){
                                have = true;
                            }
                        })
                        console.log(have)
                        if(!have){
                            console.log(p)
                            products.splice(index, 1);
                        }
                    }
                 })
                res.send(JSON.stringify(products));


            }) } catch (error) {
            res.send(error)
            res.sendStatus(400);
        }
    }
    else{
        res.sendStatus(400)
    }
}

function getWhitelistInfo(userid,_then){

    const whitelisted = [['Emilie','Chapelle','echapelle']];
    console.log("swoosh")
    console.log(userid)
    if(whitelisted.map(w => {
        if(w.includes(userid)){
            _then(w);
        }
    }))
            getWhitelist().map((wl_user) => {

                if(wl_user[0].includes(userid)){
                    _then(wl_user[0])
                }
        })
   _then(null)
}
