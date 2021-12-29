const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const authRoute = require('./routes/routes');
const session = require('express-session')
const productRequests = require('./sql/productRequests')
const rateLimit = require("express-rate-limit");
const {fetchPath} = require("./sql/orderRequest");


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500 // limit each IP to 100 requests per windowMs
});


const PORT = 3000;
async function mainTask(i){
    i++;
    await productRequests.updateProductsFromDB((data) =>{
        console.log("Successfully fetched");
    });
    await sleep(1000*60*10);
    await mainTask(i);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
app.use(limiter);

app.use(session({
    secret: "SuF0ikdxxnoM4OBDRISQiHIEPKqpnM8e",
    saveUninitialized:false,
    cookie: { httpOnly: true,maxAge: 1000 * 60 * 60 * 24 },
    resave: false
}));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
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
    mainTask(0)
});

