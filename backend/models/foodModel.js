const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    cookId: { type: mongoose.Schema.Types.ObjectId, ref: 'cook', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], required: true },
    isVeg: { type: Boolean, default: true }
}, { timestamps: true });

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);

module.exports = foodModel;