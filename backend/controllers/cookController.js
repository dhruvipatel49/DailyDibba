const cookModel = require('../models/cookModel');

// 1. Add a new cook to the database
const addCook = async (req, res) => {
    try {
        const cook = new cookModel({
            name: req.body.name,
            image: req.body.image,
            cuisine: req.body.cuisine,
            price: req.body.price,
            description: req.body.description,
            rating: req.body.rating
        });

        await cook.save();
        res.json({ success: true, message: "Cook added successfully!" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error adding cook" });
    }
};

// 2. Fetch all cooks from the database
const listCooks = async (req, res) => {
    try {
        const cooks = await cookModel.find({});
        res.json({ success: true, data: cooks });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error fetching cooks" });
    }
};

module.exports = { addCook, listCooks };