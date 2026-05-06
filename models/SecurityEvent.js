const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "low",
            index: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["open", "resolved", "ignored"],
            default: "open",
            index: true
        },
        voter_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Voter",
            default: null
        },
        admin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminUser",
            default: null
        },
        national_id: {
            type: String,
            trim: true,
            default: ""
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
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "security_events"
    }
);

module.exports = mongoose.model("SecurityEvent", securityEventSchema);
