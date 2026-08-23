const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const Stripe = require('stripe');

// Initialize Stripe using your secret key from .env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1. Place Order & Generate Stripe Checkout (Upgraded)
const placeOrder = async (req, res) => {
    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            cookId: req.body.cookId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        });
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Map your cart items into Stripe's required format
        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "inr", // Set to INR since you are building for the Indian market
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100 // Stripe expects amounts in minimal units (paise)
            },
            quantity: item.quantity
        }));

        // Add delivery/platform charges if any (optional)
        line_items.push({
            price_data: {
                currency: "inr",
                product_data: { name: "Delivery Charges" },
                unit_amount: 20 * 100 // ₹20 delivery fee
            },
            quantity: 1
        });

        // Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${process.env.FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`
        });

        // Send the Stripe session URL back to the frontend
        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error initializing payment" });
    }
};

// 2. Verify Payment Status
const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment Failed, Order Cancelled" });
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error verifying payment" });
    }
};

// ... keep your existing userOrders, cookOrders, and updateStatus functions here ...

module.exports = { placeOrder, verifyOrder, /* other existing exports */ };