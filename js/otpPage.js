document.addEventListener("DOMContentLoaded", () => {
    const verificationContext = window.EgyVoteApi.getPendingVerification();

    if (!verificationContext || !verificationContext.nationalId) {
        window.location.href = "/vote";
        return;
    }

    const otpForm = document.querySelector("[data-otp-form]");
    const otpInput = document.querySelector("[data-otp-input]");
    const statusBox = document.querySelector("[data-status-box]");
    const submitButton = document.querySelector("[data-submit-button]");
    const resendButton = document.querySelector("[data-resend-button]");
    const nationalIdText = document.querySelector("[data-national-id-text]");
    const maskedEmailText = document.querySelector("[data-masked-email-text]");

    nationalIdText.textContent = verificationContext.nationalId;
    maskedEmailText.textContent = verificationContext.maskedEmail || "—";

    if (verificationContext.requestMessage) {
        showStatus(verificationContext.requestMessage, "info");
    }

    otpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const otp = otpInput.value.trim();

        if (!/^\d{6}$/.test(otp)) {
            showStatus("رمز التحقق يجب أن يتكون من 6 أرقام.", "error");
            return;
        }

        toggleLoading(true);

        try {
            const result = await window.EgyVoteApi.verifyOtp(verificationContext.nationalId, otp);

            window.EgyVoteApi.setVerifiedSession({
                token: result.token,
                voter: result.voter
            });
            window.EgyVoteApi.clearPendingVerification();

            window.location.href = "/candidates";
        } catch (error) {
            showStatus(error.message, "error");
        } finally {
            toggleLoading(false);
        }
    });

    resendButton.addEventListener("click", async () => {
        toggleLoading(true);

        try {
            const result = await window.EgyVoteApi.requestOtp(verificationContext.nationalId);

            const refreshedContext = {
                ...verificationContext,
                maskedEmail: result.maskedEmail,
                expiresInSeconds: result.expiresInSeconds,
                requestMessage: result.message || ""
            };

            window.EgyVoteApi.setPendingVerification(refreshedContext);
            maskedEmailText.textContent = refreshedContext.maskedEmail || "—";

            showStatus("تم إرسال رمز جديد إلى بريدك الإلكتروني.", "info");
        } catch (error) {
            showStatus(error.message, "error");
        } finally {
            toggleLoading(false);
        }
    });

    function toggleLoading(isLoading) {
        submitButton.disabled = isLoading;
        resendButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "جارٍ التحقق..." : "تأكيد";
        resendButton.textContent = isLoading ? "جارٍ الإرسال..." : "إعادة إرسال الرمز";
    }

    function showStatus(message, type) {
        statusBox.textContent = message;
        statusBox.className = `status-box is-visible is-${type}`;
    }
});
