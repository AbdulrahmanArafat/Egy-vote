const mongoose = require("mongoose");

const platformSettingSchema = new mongoose.Schema(
    {
        singleton_key: {
            type: String,
            required: true,
            unique: true,
            default: "platform"
        },
        platform_name: {
            type: String,
            required: true,
            trim: true,
            default: "Egy Vote"
        },
        logo_path: {
            type: String,
            trim: true,
            default: "/images/logo.png"
        },
        timezone: {
            type: String,
            trim: true,
            default: "Africa/Cairo"
        },
        language: {
            type: String,
            trim: true,
            default: "en"
        },
        session_timeout_minutes: {
            type: Number,
            default: 60,
            min: 5,
            max: 480
        },
        maintenance_mode: {
            type: Boolean,
            default: false
        },
        maintenance_message: {
            type: String,
            trim: true,
            default: "Platform maintenance is currently enabled."
        },
        result_visibility: {
            type: String,
            enum: ["hidden", "after_end", "live"],
            default: "after_end"
        },
        verification_settings: {
            require_otp: {
                type: Boolean,
                default: true
            },
            require_admin_approval: {
                type: Boolean,
                default: true
            }
        },
        security_settings: {
            max_failed_login_attempts: {
                type: Number,
                default: 3,
                min: 1,
                max: 10
            },
            lock_suspicious_accounts: {
                type: Boolean,
                default: true
            }
        },
        backup_meta: {
            last_backup_at: {
                type: Date,
                default: null
            }
        }
    },
    {
        versionKey: false,
        timestamps: true,
        collection: "platform_settings"
    }
);

module.exports = mongoose.model("PlatformSetting", platformSettingSchema);
