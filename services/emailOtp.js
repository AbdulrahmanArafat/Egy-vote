const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function isEmailConfigured() {
    return !!process.env.RESEND_API_KEY;
}

async function sendOtpViaEmail(email, otp) {
    if (!isEmailConfigured()) {
        return { ok: false, isDemoMode: true, message: "RESEND_API_KEY is missing." };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: "Egy-Vote <onboarding@resend.dev>",
            to: email,
            subject: "رمز التحقق الخاص بك — Egy Vote",
            text: `رمز التحقق الخاص بالتصويت هو: ${otp}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.`
        });

        if (error) {
            console.error("[Email OTP] فشل الإرسال:", error);
            return { ok: false, isDemoMode: false, message: error.message };
        }

        console.log(`[Email OTP] تم الإرسال إلى ${email}: ${data.id}`);
        return { ok: true, isDemoMode: false, messageId: data.id };
    } catch (error) {
        console.error("[Email OTP] فشل الإرسال:", error);
        return { ok: false, isDemoMode: false, message: error.message };
    }
}

function getEmailConfigurationStatus() {
    return { ok: isEmailConfigured(), issues: [] };
}

module.exports = { isEmailConfigured, sendOtpViaEmail, getEmailConfigurationStatus };