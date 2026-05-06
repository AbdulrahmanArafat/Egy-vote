document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-national-id-form]");
    const nationalIdInput = document.querySelector("[data-national-id-input]");
    const statusBox = document.querySelector("[data-status-box]");
    const submitButton = document.querySelector("[data-submit-button]");

    if (!form || !nationalIdInput || !statusBox || !submitButton) {
        return;
    }

    const receipt = window.EgyVoteApi.getVoteReceipt();
    if (receipt) {
        showStatus(receipt.message, "success");
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nationalId = nationalIdInput.value.trim();

        if (!/^\d{14}$/.test(nationalId)) {
            showStatus("الرقم القومي يجب أن يتكون من 14 رقمًا.", "error");
            return;
        }

        toggleLoading(true);

        try {
            const result = await window.EgyVoteApi.requestOtp(nationalId);

            window.EgyVoteApi.clearVoteReceipt();
            window.EgyVoteApi.setPendingVerification({
                nationalId,
                maskedEmail: result.maskedEmail,
                expiresInSeconds: result.expiresInSeconds,
                requestMessage: result.message || ""
            });

            window.location.href = "/otp";
        } catch (error) {
            showStatus(error.message, "error");
        } finally {
            toggleLoading(false);
        }
    });

    function toggleLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "جارٍ الإرسال..." : "إرسال رمز التحقق";
    }

    function showStatus(message, type) {
        statusBox.textContent = message;
        statusBox.className = `status-box is-visible is-${type}`;
    }
});
