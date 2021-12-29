const express = require('express');
const router = express.Router();

const orderController = require('../controller/orderController.js');
const userController = require('../controller/userController');
const adminController = require('../controller/adminController');

// compact status router

router.post("/order", orderController.order);

router.get("/order/get/:orderid", orderController.fetchOrder);

router.get("/order/update/:orderid", orderController.fetchOrderUpdate);

router.get("/order/cancel/:orderid", orderController.cancelOrder);

router.get("/order/accept/:orderid", adminController.acceptCommand);

router.get("/order/coursier/:orderid", adminController.acceptCoursier);

router.get("/order/delivered/:orderid", adminController.delivered);

router.post("/order/ranking/:orderid", orderController.rankOrder);

router.post("/location/update", adminController.updateCoursierLocation);

router.get("/location/:orderid", orderController.getLocationUpdate);


router.get("/order/fetch", adminController.fetchOrders);

router.get("/products", userController.fetchProducts);

router.get("/login/:token/:ticket", userController.atemptAuthentification);

router.get("/user/id", userController.fetchUserID);

module.exports = router;