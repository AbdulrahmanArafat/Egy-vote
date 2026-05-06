const mongoose = require("mongoose");

async function connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/egy-vote";

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully.");
}

module.exports = {
    connectToDatabase
};
