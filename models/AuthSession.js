const mongoose = require("mongoose");

const authSessionSchema = new mongoose.Schema(
    {
        session_type: {
            type: String,
            enum: ["otp", "verified"],
            required: true,
            index: true
        },
        national_id: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        voter_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Voter",
            required: true,
            index: true
        },
        otp_code_hash: {
            type: String,
            default: null
        },
        token: {
            type: String,
            default: null,
            unique: true,
            sparse: true
        },
        expires_at: {
            type: Date,
            required: true
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "auth_sessions"
    }
);

authSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AuthSession", authSessionSchema);
