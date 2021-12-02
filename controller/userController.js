const fetch = require('node-fetch');
const userRequest = require('../sql/userRequests')



module.exports.atemptAuthentification = async (req,res) => {
    let castoken = req.params.token;;
    let casticket = req.params.ticket;
    console.log(castoken);
    console.log(casticket);
    let user_id = await getCasUserID(castoken,casticket)
    //Initialise session
    let sess = req.session;
    await userRequest.userExist(user_id,(exist) =>{
        if(!exist){
            console.log("doesn't exist");
            userRequest.createUser(user_id,)
        }
        sess.user_id = user_id;
        res.json(user_id);
    });


};


module.exports.fetchUserID = (req,res) => {
    if(req.session.user_id){
        res.send(req.session.user_id)
    }
    else{
        res.send('undefined');
    }
};

async function getCasUserID(token,ticket){
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

