document.addEventListener("DOMContentLoaded", () => {
    const verifiedSession = window.EgyVoteApi.getVerifiedSession();
    const receipt = window.EgyVoteApi.getVoteReceipt();
    const statusBox = document.querySelector("[data-status-box]");
    const candidatesGrid = document.querySelector("[data-candidates-grid]");
    const loadingText = document.querySelector("[data-loading-text]");
    const successPanel = document.querySelector("[data-success-panel]");
    const successCandidate = document.querySelector("[data-success-candidate]");
    const successVoter = document.querySelector("[data-success-voter]");
    const successNationalId = document.querySelector("[data-success-national-id]");
    const successHasVoted = document.querySelector("[data-success-has-voted]");
    const modal = document.querySelector("[data-confirm-modal]");
    const modalCandidateName = document.querySelector("[data-modal-candidate-name]");
    const confirmButton = document.querySelector("[data-confirm-button]");
    const cancelButton = document.querySelector("[data-cancel-button]");
    const closeAfterSuccessButton = document.querySelector("[data-return-button]");
    const voterNameText = document.querySelector("[data-voter-name]");

    let selectedCandidate = null;

    closeAfterSuccessButton.addEventListener("click", () => {
        window.location.href = "/vote";
    });

    if (receipt) {
        renderReceipt(receipt);
        return;
    }

    if (!verifiedSession || !verifiedSession.token) {
        window.location.href = "/vote";
        return;
    }

    if (verifiedSession.voter && verifiedSession.voter.name) {
        voterNameText.textContent = verifiedSession.voter.name;
    }

    loadCandidates();

    cancelButton.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    confirmButton.addEventListener("click", async () => {
        if (!selectedCandidate) {
            return;
        }

        confirmButton.disabled = true;
        confirmButton.textContent = "جارٍ تأكيد التصويت...";

        try {
            const result = await window.EgyVoteApi.submitVote(selectedCandidate.id);
            const finalReceipt = {
                message: result.message,
                candidateName: result.candidate.name,
                voterName: result.voter.name,
                nationalId: result.voter.nationalId,
                hasVoted: result.voter.has_voted
            };

            window.EgyVoteApi.setVoteReceipt(finalReceipt);
            window.EgyVoteApi.clearVerifiedSession();
            renderReceipt(finalReceipt);
            closeModal();
        } catch (error) {
            showStatus(error.message, "error");
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = "تأكيد التصويت";
        }
    });

    async function loadCandidates() {
        try {
            const result = await window.EgyVoteApi.getCandidates();
            candidatesGrid.innerHTML = "";
            loadingText.hidden = true;

            result.candidates.forEach((candidate) => {
                const card = document.createElement("article");
                card.className = "candidate-card";
                card.innerHTML = `
                    <img src="${candidate.photo}" alt="صورة ${candidate.name}">
                    <div class="candidate-card-body">
                        <h3>${candidate.name}</h3>
                        <div class="candidate-meta">
                            <span>العمر: ${candidate.age} سنة</span>
                            <span>مرشح رئاسي</span>
                        </div>
                        <div class="candidate-votes">عدد الأصوات الحالي: ${candidate.number_of_votes}</div>
                        <button class="primary-button" type="button">تصويت لهذا المرشح</button>
                    </div>
                `;

                const voteButton = card.querySelector("button");
                voteButton.addEventListener("click", () => openModal(candidate));
                candidatesGrid.appendChild(card);
            });
        } catch (error) {
            loadingText.hidden = true;

            if (error.message.includes("جلسة")) {
                window.location.href = "/vote";
                return;
            }

            showStatus(error.message, "error");
        }
    }

    function openModal(candidate) {
        selectedCandidate = candidate;
        modalCandidateName.textContent = candidate.name;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modal.classList.remove("is-open");
        selectedCandidate = null;
        document.body.style.overflow = "";
    }

    function renderReceipt(currentReceipt) {
        loadingText.hidden = true;
        candidatesGrid.innerHTML = "";
        successCandidate.textContent = currentReceipt.candidateName;
        successVoter.textContent = currentReceipt.voterName;
        successNationalId.textContent = currentReceipt.nationalId;
        successHasVoted.textContent = String(Boolean(currentReceipt.hasVoted));
        successPanel.classList.add("is-visible");
        showStatus(currentReceipt.message, "success");
    }

    function showStatus(message, type) {
        statusBox.textContent = message;
        statusBox.className = `status-box is-visible is-${type}`;
    }
});
