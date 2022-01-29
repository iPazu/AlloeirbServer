const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken")

const orderController = require('../controller/orderController.js');
const userController = require('../controller/userController');
const adminController = require('../controller/adminController');

function authenticateToken(req, res, next) {
    console.log("checking for token")

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    console.log("DISPLAYING TOKEN")

    console.log(token)
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        console.log(err)
        if (err) return res.sendStatus(403)
        req.user_id = user
        next()
    })
}
// compact status router

router.post("/order",authenticateToken,orderController.order);

router.get("/order/get/:orderid",authenticateToken ,orderController.fetchOrder);


router.get("/order/cancel/:orderid",authenticateToken ,orderController.cancelOrder);

router.get("/order/accept/:orderid", authenticateToken,adminController.acceptCommand);

router.get("/order/coursier/:orderid",authenticateToken, adminController.acceptCoursier);

router.get("/order/delivered/:orderid",authenticateToken, adminController.delivered);

router.post("/order/ranking/:orderid",authenticateToken ,orderController.rankOrder);

router.post("/location/update" ,adminController.updateCoursierLocation);

router.get("/user/code/:code", authenticateToken ,userController.addCode);


router.get("/order/fetch",authenticateToken ,adminController.fetchOrders);

router.get("/products",authenticateToken, userController.fetchProducts);

router.get("/login/:token/:ticket" ,userController.atemptAuthentification);

router.get("/user/id" ,userController.fetchUserID);

module.exports = router;