const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const authRoute = require('./routes/routes');
const session = require('express-session')
const productRequests = require('./sql/productRequests')
const rateLimit = require("express-rate-limit");
const fs = require('fs');
let {setWhitelist} = require("./sql/userRequests");

const { Appsignal } = require("@appsignal/nodejs");
const {getRunningOrder} = require("./sql/orderRequest");
const {setRunningOrderNumber} = require("./sql/productRequests");

const appsignal = new Appsignal({
    active: true,
    name: "Alloeirb",
    pushApiKey: "bec39a80-4710-4704-91df-7a103077de84\n" // Note: renamed from `apiKey` in version 2.2.5
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500 // limit each IP to 100 requests per windowMs
});


const PORT = process.env.PORT || 3000 ;
async function mainTask(i){
    i++;
    await productRequests.updateProductsFromDB((data) =>{

        console.log("Successfully fetched products");
    });
    await productRequests.updateCodesFromDB((data) =>{

        console.log("Successfully fetched codes");
    });

    await sleep(1000*60);
    await mainTask(i);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
app.use(limiter);

app.set("trust proxy", 1);

app.use(session({
    secret: "SuF0ikdxxnoM4OBDRISQiHIEPKqpnM8e",
    saveUninitialized:false,
    proxy : true, // add this when behind a reverse proxy, if you need secure cookies
    cookie: {
        httpOnly: true,

        sameSite: 'none',
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 },
    resave: false
}));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_HOST);
    res.setHeader("Access-Control-Allow-Credentials" ,'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});



app.post('/pusher/auth', function(req, res) {
    var socketId = req.body.socket_id;
    var channel = req.body.channel_name;
    var auth = pusher.authenticate(socketId, channel);

    res.send(auth);
});
app.use(express.json());

app.use('/api',authRoute);



app.listen(PORT, () => {
    console.log("Server started")
    //
    w = fs.readFileSync('listes-eleves.csv')
        .toString() // convert Buffer to string
        .split('\n') // split string to lines
        .map(e => e.trim()) // remove white spaces for each line
        .map(e => e.split(',').map(e => e.trim())); // split each line to array
    setWhitelist(w)

    let n = getRunningOrder((n)=>{
        setRunningOrderNumber(n)
        console.log(n+" running orders")
    })

    mainTask(0)
});




