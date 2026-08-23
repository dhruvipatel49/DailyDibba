const express = require('express');
const { addCook, listCooks } = require('../controllers/cookController');

const cookRouter = express.Router();

// Route to add a cook (POST request)
cookRouter.post('/add', addCook);

// Route to get all cooks (GET request)
cookRouter.get('/list', listCooks);

module.exports = cookRouter;