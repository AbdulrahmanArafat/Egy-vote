const PlatformSetting = require("../../models/PlatformSetting");

const DEFAULT_SETTINGS = {
    singleton_key: "platform",
    platform_name: "Egy Vote",
    logo_path: "/images/logo.png",
    timezone: "Africa/Cairo",
    language: "en",
    session_timeout_minutes: 60,
    maintenance_mode: false,
    maintenance_message: "Platform maintenance is currently enabled.",
    result_visibility: "after_end",
    verification_settings: {
        require_otp: true,
        require_admin_approval: true
    },
    security_settings: {
        max_failed_login_attempts: 3,
        lock_suspicious_accounts: true
    },
    backup_meta: {
        last_backup_at: null
    }
};

async function getPlatformSettings() {
    let settings = await PlatformSetting.findOne({ singleton_key: "platform" });

    if (!settings) {
        settings = await PlatformSetting.create(DEFAULT_SETTINGS);
    }

    return settings;
}

async function updatePlatformSettings(payload) {
    await PlatformSetting.updateOne(
        { singleton_key: "platform" },
        {
            $set: payload
        },
        { upsert: true }
    );

    return getPlatformSettings();
}

module.exports = {
    DEFAULT_SETTINGS,
    getPlatformSettings,
    updatePlatformSettings
};
