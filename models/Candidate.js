const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        age: {
            type: Number,
            required: true,
            min: 1
        },
        number_of_votes: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        photo: {
            type: String,
            required: true,
            trim: true
        },
        bio: {
            type: String,
            trim: true,
            default: ""
        },
        manifesto: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["approved", "pending", "rejected"],
            default: "approved",
            index: true
        },
        election_ids: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Election"
            }
        ]
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "candidates"
    }
);

candidateSchema.index({ name: "text", bio: "text", manifesto: "text" });

module.exports = mongoose.model("Candidate", candidateSchema);
