// indexPage.js — يملأ البيانات الديناميكية للصفحة الرئيسية من /api/election/status
(function () {
    "use strict";

    const API_BASE = window.location.port === "3000" ? "" : "http://127.0.0.1:3000";

    async function loadElectionStatus() {
        try {
            const response = await fetch(`${API_BASE}/api/election/status`);
            if (!response.ok) throw new Error("فشل جلب حالة الانتخابات");
            const data = await response.json();
            renderHeroAction(data);
            renderElectionCard(data);
        } catch (error) {
            console.error("[indexPage] خطأ:", error);
            renderHeroFallback();
        }
    }

    // ── زر التصويت في الـ hero ──────────────────────────────────────────────────
    function renderHeroAction({ activeElection }) {
        const container = document.getElementById("hero-vote-action");
        if (!container) return;

        if (activeElection) {
            container.innerHTML = `
                <a href="/vote" class="cta-primary" id="vote-now-btn" aria-label="ابدأ عملية التصويت الآن">
                    <i class="fa-solid fa-vote-yea" aria-hidden="true"></i>
                    صوّت الآن
                </a>`;
        } else {
            container.innerHTML = `
                <span class="cta-primary cta-disabled" aria-label="لا توجد انتخابات نشطة حالياً">
                    <i class="fa-solid fa-clock" aria-hidden="true"></i>
                    لا توجد انتخابات نشطة
                </span>`;
        }
    }

    function renderHeroFallback() {
        const container = document.getElementById("hero-vote-action");
        if (!container) return;
        container.innerHTML = `
            <span class="cta-primary cta-disabled" aria-label="لا توجد انتخابات نشطة حالياً">
                <i class="fa-solid fa-clock" aria-hidden="true"></i>
                لا توجد انتخابات نشطة
            </span>`;
    }

    // ── بطاقة الانتخابات ────────────────────────────────────────────────────────
    function renderElectionCard({ activeElection, latestClosedElection }) {
        const section = document.getElementById("election-card-section");
        if (!section) return;

        const election = activeElection || latestClosedElection;
        if (!election) return; // لا يوجد شيء — القسم يبقى مخفياً

        // إظهار القسم
        section.hidden = false;

        // العنوان
        const titleEl = section.querySelector("[data-election-title]");
        if (titleEl) titleEl.textContent = election.title || "الانتخابات";

        // Badge الحالة
        const activeBadge = document.getElementById("election-status-badge");
        const closedBadge = document.getElementById("election-closed-badge");
        if (activeElection) {
            if (activeBadge) activeBadge.hidden = false;
            if (closedBadge) closedBadge.hidden = true;
        } else {
            if (activeBadge) activeBadge.hidden = true;
            if (closedBadge) closedBadge.hidden = false;
        }

        // التواريخ
        const datesRow = document.getElementById("election-dates");
        const startEl = section.querySelector("[data-election-start]");
        const endEl = section.querySelector("[data-election-end]");
        const sepEl = section.querySelector("[data-election-date-sep]");

        if (datesRow && (election.start_date || election.end_date)) {
            datesRow.hidden = false;
            const locale = "ar-EG";
            if (startEl) startEl.textContent = election.start_date
                ? new Date(election.start_date).toLocaleDateString(locale) : "";
            if (endEl) endEl.textContent = election.end_date
                ? new Date(election.end_date).toLocaleDateString(locale) : "";
            if (sepEl) sepEl.hidden = !(election.start_date && election.end_date);
        }

        // أزرار الإجراءات
        const voteBtn = document.getElementById("election-vote-btn");
        const resultsBtn = document.getElementById("election-results-btn");

        if (voteBtn) voteBtn.hidden = !activeElection;
        if (resultsBtn) resultsBtn.hidden = !latestClosedElection;
    }

    // ── تشغيل ──────────────────────────────────────────────────────────────────
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadElectionStatus);
    } else {
        loadElectionStatus();
    }
})();
