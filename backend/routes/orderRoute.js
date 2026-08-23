const express = require('express');
const { placeOrder, userOrders, cookOrders, updateStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const { placeOrder, userOrders, cookOrders, updateStatus, verifyOrder } = require('../controllers/orderController');

const orderRouter = express.Router();

// Customer Endpoints
orderRouter.post('/place', authMiddleware, placeOrder);
orderRouter.post('/userorders', authMiddleware, userOrders);
orderRouter.post('/verify', authMiddleware, verifyOrder);

// Cook Endpoints
orderRouter.post('/cookorders', cookOrders);
orderRouter.post('/status', updateStatus);

module.exports = orderRouter;