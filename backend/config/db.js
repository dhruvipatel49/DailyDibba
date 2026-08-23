const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connects to MongoDB using the secret string in our .env file
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed: ", error);
        process.exit(1); // Stops the server if the connection fails
    }
};

module.exports = connectDB;