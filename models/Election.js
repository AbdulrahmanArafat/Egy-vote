const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        category: {
            type: String,
            trim: true,
            default: "General"
        },
        start_at: {
            type: Date,
            required: true
        },
        end_at: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["draft", "upcoming", "active", "ended", "archived"],
            default: "draft",
            index: true
        },
        candidate_ids: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Candidate"
            }
        ],
        is_results_visible: {
            type: Boolean,
            default: false
        },
        allow_live_results: {
            type: Boolean,
            default: false
        },
        manually_closed_at: {
            type: Date,
            default: null
        },
        is_default_seed: {
            type: Boolean,
            default: false
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "elections"
    }
);

electionSchema.index({ title: "text", description: "text", category: "text" });

module.exports = mongoose.model("Election", electionSchema);
