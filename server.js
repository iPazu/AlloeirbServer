const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const authRoute = require('./routes/routes');
const session = require('express-session')

const PORT = 3000;


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

app.use(express.json());
app.use('/api',authRoute);




app.listen(PORT, () => console.log("Server started"));

