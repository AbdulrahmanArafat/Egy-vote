const nodemailer = require("nodemailer");

const PLACEHOLDER_PASSWORDS = new Set([
    "your_app_password_here",
    "YOUR_APP_PASSWORD",
    "YOUR_APP_PASSWORD_HERE"
]);

function getEnvValue(name) {
    return String(process.env[name] || "").trim();
}

function normalizeEmailAddress(value) {
    return String(value || "").trim().toLowerCase();
}

function extractEmailAddress(value) {
    const rawValue = String(value || "").trim();
    const match = rawValue.match(/<([^>]+)>/);
    return normalizeEmailAddress(match ? match[1] : rawValue);
}

function getSenderEmail() {
    return normalizeEmailAddress(getEnvValue("EMAIL_USER"));
}

function getFormattedFromAddress() {
    const senderEmail = getSenderEmail();
    const rawFrom = getEnvValue("EMAIL_FROM");

    if (!senderEmail) {
        return rawFrom;
    }

    if (!rawFrom) {
        return `Egy-Vote <${senderEmail}>`;
    }

    const displayNameMatch = rawFrom.match(/^(.*)<[^>]+>\s*$/);
    const displayName = displayNameMatch
        ? displayNameMatch[1].trim().replace(/^"|"$/g, "")
        : rawFrom.includes("@")
            ? ""
            : rawFrom.trim();

    return displayName
        ? `${displayName} <${senderEmail}>`
        : senderEmail;
}

function getEmailConfigurationStatus() {
    const host = getEnvValue("EMAIL_HOST");
    const port = getEnvValue("EMAIL_PORT");
    const senderEmail = getSenderEmail();
    const pass = getEnvValue("EMAIL_PASS");
    const rawFrom = getEnvValue("EMAIL_FROM");
    const fromEmail = extractEmailAddress(rawFrom);
    const issues = [];

    if (!host) {
        issues.push("EMAIL_HOST is missing.");
    }

    if (!port) {
        issues.push("EMAIL_PORT is missing.");
    }

    if (!senderEmail) {
        issues.push("EMAIL_USER is missing.");
    }

    if (!pass) {
        issues.push("EMAIL_PASS is missing.");
    } else if (PLACEHOLDER_PASSWORDS.has(pass)) {
        issues.push("EMAIL_PASS is still a placeholder value.");
    }

    if (rawFrom && fromEmail && senderEmail && fromEmail !== senderEmail) {
        issues.push("EMAIL_FROM address did not match EMAIL_USER and was normalized.");
    }

    return {
        ok: issues.length === 0,
        issues,
        senderEmail,
        fromAddress: getFormattedFromAddress()
    };
}

function isEmailConfigured() {
    return getEmailConfigurationStatus().ok;
}

function getEmailTransporter() {
    return nodemailer.createTransport({
        host: getEnvValue("EMAIL_HOST"),
        port: parseInt(getEnvValue("EMAIL_PORT") || "587", 10),
        secure: getEnvValue("EMAIL_SECURE") === "true",
        auth: {
            user: getSenderEmail(),
            pass: getEnvValue("EMAIL_PASS")
        }
    });
}

async function sendOtpViaEmail(email, otp) {
    const configurationStatus = getEmailConfigurationStatus();

    if (!configurationStatus.ok) {
        return {
            ok: false,
            isDemoMode: true,
            message: `Email configuration is invalid: ${configurationStatus.issues.join(" ")}`
        };
    }

    try {
        const transporter = getEmailTransporter();
        const plainTextMessage = [
            "Egy Vote",
            "",
            "رمز التحقق الخاص بالتصويت هو:",
            otp,
            "",
            "هذا الرمز صالح لمدة 10 دقائق فقط.",
            "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة."
        ].join("\n");

        const mailOptions = {
            from: configurationStatus.fromAddress,
            to: email,
            subject: "رمز التحقق الخاص بك — Egy Vote",
            text: plainTextMessage
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email OTP] تم الإرسال إلى ${email}: ${info.messageId}`);

        return { ok: true, isDemoMode: false, messageId: info.messageId };
    } catch (error) {
        console.error("[Email OTP] فشل الإرسال:", error);
        return {
            ok: false,
            isDemoMode: false,
            message: "فشل في إرسال البريد الإلكتروني: " + error.message
        };
    }
}

module.exports = { isEmailConfigured, sendOtpViaEmail, getEmailConfigurationStatus };
