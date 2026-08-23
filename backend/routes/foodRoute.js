const express = require('express');
const { addFood, getCookMenu } = require('../controllers/foodController');
const upload = require('../middleware/upload'); // Import Multer

const foodRouter = express.Router();

// Add the upload.single('image') middleware before the controller function
foodRouter.post('/add', upload.single('image'), addFood);
foodRouter.get('/menu/:cookId', getCookMenu);

module.exports = foodRouter;