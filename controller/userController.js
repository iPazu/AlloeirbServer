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
    console.log("user auth")
    let castoken = req.params.token;
    let casticket = req.params.ticket;
    let user_id = await getCasUserID(castoken, casticket)

    getWhitelistInfo(user_id,(userinfo) => {
        console.log(userinfo)
        let lastname =  String(userinfo).split(";")[0]
        let firstname = String(userinfo).split(";")[1]
        const accessToken = jwt.sign(user_id,process.env.SECRET_TOKEN)
        //Initialise session
        let sess = req;
     userRequest.userExist(user_id, (exist,id,privilege,codes) => {
        if (!exist) {
            console.log("Creating user")
            userRequest.createUser(user_id).then(()=> {
                console.log("USER CREATED " + user_id)
                nextStep()
            })
        }
        else{
            nextStep()
        }
        function nextStep(){
            sess.user_id = user_id;
            let orderid = id;
            let  codeObject = {}
            let allCodes = getCodes()
            if(codes !== undefined){
                codes.split(",").map(c => {
                    allCodes.map(ac => {
                        if(ac.name === c){
                            codeObject[c] = ac.reduction
                        }
                    })
                })
        }
            res.send({user_id,firstname,orderid,privilege,codeObject,accessToken});
        }

    });
    })

};

module.exports.fetchUserID = (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null){
        res.send('undefined');
        return;
    }

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) {
            res.send('undefined');
            return;
        }
        res.send(user)
    })

};
module.exports.addCode = (req,res) => {
    let codetoadd = req.params.code
    userRequest.addPromotionCode(codetoadd,req.user_id, (status) => {
        console.log(status)
        console.log("holla")
        let codes = getCodes()
        console.log("chico")
        let reduction = 0
        console.log("fetched codes")
        codes.map(c => {
            if(c.name === codetoadd){
                reduction = c.reduction
            }
        })
        console.log("mapped them")
        console.log("sending status"+status)
        if(status === 200){
            console.log("it's good sending positive feedback")
            let codeObj = {}
            codeObj[codetoadd]  = reduction
            res.json(codeObj)
        }
        console.log("sending status"+status)
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
    return data;

}

module.exports.fetchProducts = async (req, res) => {
    if(req.user_id){
        try {
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
                        if(!have){
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
    let returned = false
    whitelisted.map(w => {
        if(w.includes(userid)){
            returned = true;
            _then(w);
        }
    })
    if(!returned){
        let wl = getWhitelist()
        for (let i = 0; i < wl.length; i++) {
            let wl_user = wl[i]
            if(wl_user[0].includes(userid)){
                returned = true;
                _then(wl_user[0])
                break
            }
        }
    if(!returned){
        console.log("shouldn't be there")
        _then(null)
    }
    }
}
