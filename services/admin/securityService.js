const SecurityEvent = require("../../models/SecurityEvent");
const Voter = require("../../models/Voter");
const { getPlatformSettings } = require("./settingsService");
const { getRequestIp } = require("./auditService");

function getRequestMeta(request) {
    return {
        ipAddress: getRequestIp(request),
        userAgent: request.headers["user-agent"] || ""
    };
}

async function createSecurityEvent(payload) {
    return SecurityEvent.create({
        type: payload.type,
        severity: payload.severity || "low",
        message: payload.message,
        status: payload.status || "open",
        voter_id: payload.voterId || null,
        admin_id: payload.adminId || null,
        national_id: payload.nationalId || "",
        ip_address: payload.ipAddress || "",
        user_agent: payload.userAgent || "",
        metadata: payload.metadata || {}
    });
}

async function incrementFailedVoterLogin({ nationalId, request, reason }) {
    const voter = nationalId ? await Voter.findOne({ national_id: nationalId }) : null;
    const settings = await getPlatformSettings();
    const { ipAddress, userAgent } = getRequestMeta(request);

    if (voter) {
        voter.failed_login_attempts += 1;

        if (
            settings.security_settings.lock_suspicious_accounts &&
            voter.failed_login_attempts >= settings.security_settings.max_failed_login_attempts
        ) {
            voter.status = "blocked";
            voter.blocked_at = new Date();
            if (!voter.security_flags.includes("auto_locked")) {
                voter.security_flags.push("auto_locked");
            }
        }

        await voter.save();
    }

    await createSecurityEvent({
        type: "failed_login",
        severity: voter && voter.status === "blocked" ? "high" : "medium",
        message: reason || "Failed voter authentication attempt detected.",
        voterId: voter?._id || null,
        nationalId,
        ipAddress,
        userAgent,
        metadata: {
            failed_login_attempts: voter?.failed_login_attempts || 0
        }
    });

    return voter;
}

async function markSuccessfulVoterAuth(voter, request) {
    const { ipAddress, userAgent } = getRequestMeta(request);

    voter.failed_login_attempts = 0;
    voter.is_verified = true;
    voter.last_login_at = new Date();
    await voter.save();

    await createSecurityEvent({
        type: "auth_success",
        severity: "low",
        message: "Voter authentication completed successfully.",
        voterId: voter._id,
        nationalId: voter.national_id,
        ipAddress,
        userAgent,
        status: "resolved"
    });
}

async function recordDuplicateVoteAttempt(voter, request, metadata = {}) {
    const { ipAddress, userAgent } = getRequestMeta(request);

    await createSecurityEvent({
        type: "duplicate_vote_attempt",
        severity: "critical",
        message: "Duplicate voting attempt was blocked.",
        voterId: voter?._id || null,
        nationalId: voter?.national_id || metadata.nationalId || "",
        ipAddress,
        userAgent,
        metadata
    });
}

async function recordAdminLogin(admin, request, success = true) {
    const { ipAddress, userAgent } = getRequestMeta(request);

    await createSecurityEvent({
        type: success ? "admin_login_success" : "admin_login_failure",
        severity: success ? "low" : "high",
        message: success
            ? `Admin login success for ${admin?.email || "unknown"}.`
            : `Admin login failure for ${admin?.email || "unknown"}.`,
        adminId: admin?._id || null,
        ipAddress,
        userAgent,
        status: success ? "resolved" : "open"
    });
}

module.exports = {
    getRequestMeta,
    createSecurityEvent,
    incrementFailedVoterLogin,
    markSuccessfulVoterAuth,
    recordDuplicateVoteAttempt,
    recordAdminLogin
};
