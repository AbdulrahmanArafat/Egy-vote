const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        student_id: {
            type: String,
            trim: true,
            default: ""
        },
        has_voted: {
            type: Boolean,
            required: true,
            default: false
        },
        national_id: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        status: {
            type: String,
            enum: ["approved", "pending", "blocked", "rejected"],
            default: "approved",
            index: true
        },
        is_verified: {
            type: Boolean,
            default: false,
            index: true
        },
        verification_method: {
            type: String,
            enum: ["otp", "manual", "imported", "none"],
            default: "otp"
        },
        failed_login_attempts: {
            type: Number,
            default: 0,
            min: 0
        },
        last_login_at: {
            type: Date,
            default: null
        },
        last_vote_at: {
            type: Date,
            default: null
        },
        blocked_at: {
            type: Date,
            default: null
        },
        approved_at: {
            type: Date,
            default: null
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        },
        security_flags: {
            type: [String],
            default: []
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "voters"
    }
);

voterSchema.index({ name: "text", email: "text", national_id: "text", student_id: "text" });

module.exports = mongoose.model("Voter", voterSchema);
