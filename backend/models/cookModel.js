const mongoose = require('mongoose');

// This defines the blueprint for every Cook/Tiffin Provider in your app
const cookSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    cuisine: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true }); // Automatically tracks 'createdAt' and 'updatedAt' times

// Reuses existing model if created, or builds a new one named 'cook'
const cookModel = mongoose.models.cook || mongoose.model("cook", cookSchema);

module.exports = cookModel;