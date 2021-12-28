const fetch = require('node-fetch');
const userRequest = require('../sql/userRequests')
const {getProducts} = require("../sql/productRequests");


module.exports.atemptAuthentification = async (req, res) => {
    console.log("auth")

    let castoken = req.params.token;

    let casticket = req.params.ticket;
    console.log(castoken);
    console.log(casticket);
    let user_id = await getCasUserID(castoken, casticket)
    user_id = "alaboirie"
    //Initialise session
    let sess = req.session;
    await userRequest.userExist(user_id, (exist,id,privilege) => {
        if (!exist) {
            console.log("doesn't exist");
            userRequest.createUser(user_id)
        }
        console.log("user exist")
        sess.user_id = user_id;
        let orderid = id.orderid;
        res.send({user_id,orderid,privilege});
    });
};

module.exports.fetchUserID = (req, res) => {
    if (req.session.user_id) {
        res.send(req.session.user_id)
    } else {
        res.send('undefined');
    }
};

async function getCasUserID(token, ticket) {
    const url = `https://cas.bordeaux-inp.fr/serviceValidate?service=https://alaboirie.vvv.enseirb-matmeca.fr/redirect?token=${token}&ticket=${ticket}`;
    let data;
    await fetch(url)
        .then(response => response.text())
        .then(str => {
            data = str
        });
    data = data.substring(
        data.indexOf("cas:user>a") + 1,
        data.lastIndexOf("</cas:user")
    );
    data = data.slice(8);
    console.log(data)
    return data;

}

module.exports.fetchProducts = async (req, res) => {
    console.log("Fetching products user")
    if(req.session.user_id){
        try {
            console.log("Sending products");
            res.send(JSON.stringify(getProducts()));

        } catch (error) {
            res.send(error)
            res.sendStatus(400);
        }
    }
    else{
        res.sendStatus(400)
    }
}


