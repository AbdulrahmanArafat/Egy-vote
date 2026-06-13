const { BrevoClient } = require("@getbrevo/brevo");

// ─── BrevoEmailService ────────────────────────────────────────────────────────
// Uses @getbrevo/brevo v5+ SDK (BrevoClient API — not the legacy class-based API).
// Environment variable required: BREVO_API_KEY
// ─────────────────────────────────────────────────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function createBrevoClient() {
    return new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
}

function isEmailConfigured() {
    return !!process.env.BREVO_API_KEY;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a single transactional email via Brevo with automatic retry.
 * @param {object} options
 * @param {string} options.to          - Recipient email address
 * @param {string} options.subject     - Email subject line
 * @param {string} options.textContent - Plain-text email body
 * @param {number} [attempt=1]         - Current attempt (used internally for retries)
 * @returns {Promise<{ok: boolean, isDemoMode: boolean, messageId?: string, message?: string}>}
 */
async function sendTransactionalEmail({ to, subject, textContent }, attempt = 1) {
    const client = createBrevoClient();

    try {
        const result = await client.transactionalEmails.sendTransacEmail({
            sender: { name: "Egy-Vote", email: "voteegy@gmail.com" },
            to: [{ email: to }],
            subject,
            textContent
        });

        const messageId = result?.body?.messageId || result?.messageId || "sent";
        console.log(`[BrevoEmailService] ✓ Sent to ${to} (attempt ${attempt}) — messageId: ${messageId}`);
        return { ok: true, isDemoMode: false, messageId };

    } catch (error) {
        const status = error?.response?.status || error?.status || "unknown";
        const detail =
            error?.response?.data?.message ||
            error?.response?.body?.message ||
            error?.message ||
            String(error);

        console.error(
            `[BrevoEmailService] ✗ Send failed (attempt ${attempt}/${MAX_RETRIES + 1}) — ` +
            `to: ${to} | status: ${status} | detail: ${detail}`
        );

        if (attempt <= MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * attempt);
            return sendTransactionalEmail({ to, subject, textContent }, attempt + 1);
        }

        return { ok: false, isDemoMode: false, message: detail };
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an OTP verification email to the voter.
 * Subject and body are unchanged from the original implementation.
 */
async function sendOtpViaEmail(email, otp) {
    if (!isEmailConfigured()) {
        console.warn("[BrevoEmailService] BREVO_API_KEY is not set — email sending skipped.");
        return { ok: false, isDemoMode: true, message: "BREVO_API_KEY is missing." };
    }

    return sendTransactionalEmail({
        to: email,
        subject: "رمز التحقق الخاص بك — Egy Vote",
        textContent: `رمز التحقق الخاص بالتصويت هو: ${otp}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.`
    });
}

function getEmailConfigurationStatus() {
    const configured = isEmailConfigured();
    return {
        ok: configured,
        provider: "Brevo",
        issues: configured ? [] : ["BREVO_API_KEY environment variable is not set."]
    };
}

module.exports = { isEmailConfigured, sendOtpViaEmail, getEmailConfigurationStatus };