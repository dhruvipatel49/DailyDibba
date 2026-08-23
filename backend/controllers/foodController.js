const foodModel = require('../models/foodModel');

// Add a new food item linked to a cook
const addFood = async (req, res) => {
    
    // CHANGE 1: Extract the generated filename that Multer attached to the request
    let image_filename = req.file ? req.file.filename : "default.png"; 

    try {
        const food = new foodModel({
            cookId: req.body.cookId,
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            
            // CHANGE 2: Save the Multer filename instead of req.body.image
            image: image_filename, 
            
            category: req.body.category,
            isVeg: req.body.isVeg
        });

        await food.save();
        res.json({ success: true, message: "Food item added successfully!" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error adding food item" });
    }
};

// Fetch menu for a specific cook (No changes needed here!)
const getCookMenu = async (req, res) => {
    try {
        const { cookId } = req.params;
        const menu = await foodModel.find({ cookId });
        res.json({ success: true, data: menu });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error fetching cook menu" });
    }
};

module.exports = { addFood, getCookMenu };