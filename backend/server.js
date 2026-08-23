const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const cookRouter = require('./routes/cookRoute');
const foodRouter = require('./routes/foodRoute');
const userRouter = require('./routes/userRoute');
const cartRouter = require('./routes/cartRoute');

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cors());

// API Endpoints
app.use('/api/food', foodRouter);

// Connect DB
connectDB();

// API Endpoints
app.use('/api/cook', cookRouter);

// API Endpoints
app.use('/api/user', userRouter);

// API Endpoints
app.use('/api/cart', cartRouter);

// Home Route
app.get('/', (req, res) => {
    res.send("Hello from the dailyDibba Backend!");
});

app.use('/images', express.static('uploads'));

app.listen(port, () => {
    console.log(`Server is running beautifully on http://localhost:${port}`);
});