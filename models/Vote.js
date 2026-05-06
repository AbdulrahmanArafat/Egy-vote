const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
    {
        election_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: true,
            index: true
        },
        candidate_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Candidate",
            required: true,
            index: true
        },
        voter_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Voter",
            required: true,
            index: true
        },
        cast_at: {
            type: Date,
            default: Date.now
        },
        ip_address: {
            type: String,
            trim: true,
            default: ""
        },
        user_agent: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["valid", "duplicate", "flagged"],
            default: "valid"
        },
        fraud_flags: {
            type: [String],
            default: []
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "votes"
    }
);

voteSchema.index({ voter_id: 1, election_id: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
