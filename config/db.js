const mongoose = require("mongoose");

let connectionPromise = null;

async function connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/egy-vote";

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2 && connectionPromise) {
        return connectionPromise;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(mongoUri)
            .then((connection) => {
                console.log("MongoDB connected successfully.");
                return connection;
            })
            .catch((error) => {
                connectionPromise = null;
                throw error;
            });
    }

    return connectionPromise;
}

module.exports = {
    connectToDatabase
};
