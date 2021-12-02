const express = require('express');
const router = express.Router();


const orderController = require('../controller/orderController.js');
const userController = require('../controller/userController');

// compact status router

router.get("/order", orderController.order);

router.get("/login/:token/:ticket", userController.atemptAuthentification);

router.get("/user/id", userController.fetchUserID);

module.exports = router;