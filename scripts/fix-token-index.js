/**
 * One-off migration: fix the stale non-sparse unique index on auth_sessions.token
 *
 * Problem:
 *   The `token_1` index was created in MongoDB BEFORE `sparse: true` was added to
 *   the Mongoose schema. MongoDB therefore enforces uniqueness on null values too,
 *   which causes E11000 whenever more than one OTP session exists simultaneously.
 *
 * Fix:
 *   Drop the old index. On the next server start Mongoose will auto-create a new
 *   sparse unique index that ignores null values.
 *
 * Run once:
 *   node scripts/fix-token-index.js
 */

"use strict";

const mongoose = require("mongoose");
const path = require("path");

// Load .env from project root
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("❌  No MongoDB URI found. Set MONGO_URI in your .env file.");
    process.exit(1);
}

async function main() {
    console.log("🔗  Connecting to MongoDB…");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected.\n");

    const db = mongoose.connection.db;
    const collection = db.collection("auth_sessions");

    // List current indexes so we can confirm what exists
    const existingIndexes = await collection.indexes();
    console.log("📋  Current indexes on auth_sessions:");
    existingIndexes.forEach((idx) => {
        const sparse = idx.sparse ? " [sparse]" : "";
        const unique = idx.unique ? " [unique]" : "";
        console.log(`   • ${idx.name}${unique}${sparse}`);
    });
    console.log();

    const hasOldIndex = existingIndexes.some(
        (idx) => idx.name === "token_1" && !idx.sparse
    );

    if (!hasOldIndex) {
        const hasSparseIndex = existingIndexes.some(
            (idx) => idx.name === "token_1" && idx.sparse
        );
        if (hasSparseIndex) {
            console.log("✅  The token_1 index is already sparse. Nothing to do.");
        } else {
            console.log("ℹ️   No token_1 index found at all. Mongoose will create it on next start.");
        }
        await mongoose.disconnect();
        return;
    }

    console.log("⚠️   Found non-sparse token_1 index — dropping it…");
    await collection.dropIndex("token_1");
    console.log("✅  Dropped token_1 index.\n");

    console.log("🔄  Triggering Mongoose to sync indexes (recreates with sparse: true)…");
    // Registering the model causes Mongoose to run ensureIndexes
    require("../models/AuthSession");
    await mongoose.model("AuthSession").syncIndexes();
    console.log("✅  Indexes synced.\n");

    // Confirm the result
    const updatedIndexes = await collection.indexes();
    console.log("📋  Updated indexes on auth_sessions:");
    updatedIndexes.forEach((idx) => {
        const sparse = idx.sparse ? " [sparse]" : "";
        const unique = idx.unique ? " [unique]" : "";
        console.log(`   • ${idx.name}${unique}${sparse}`);
    });

    await mongoose.disconnect();
    console.log("\n🎉  Done. You can now restart your server.");
}

main().catch((err) => {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
});
