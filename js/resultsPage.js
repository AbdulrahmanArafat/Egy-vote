// resultsPage.js — يجلب نتائج الانتخابات من /api/results ويملأ الصفحة ديناميكياً
(function () {
    "use strict";

    const API_BASE = window.location.port === "3000" ? "" : "http://127.0.0.1:3000";

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    async function loadResults() {
        try {
            const response = await fetch(`${API_BASE}/api/results`);
            if (!response.ok) throw new Error("فشل جلب النتائج");
            const data = await response.json();
            render(data);
        } catch (error) {
            console.error("[resultsPage] خطأ:", error);
            showEmpty("تعذر تحميل النتائج. يرجى المحاولة مرة أخرى.");
        }
    }

    function render({ election, results, totalVotes }) {
        const loading = document.getElementById("results-loading");
        const empty = document.getElementById("results-empty");
        const dataDiv = document.getElementById("results-data");

        if (loading) loading.hidden = true;

        if (!election) {
            if (empty) empty.hidden = false;
            return;
        }

        // عنوان الانتخابات
        const titleEl = document.querySelector("[data-results-title]");
        if (titleEl) titleEl.textContent = election.title || "نتائج الانتخابات";

        // إجمالي الأصوات
        const totalEl = document.querySelector("[data-results-total]");
        if (totalEl) totalEl.textContent = totalVotes ?? 0;

        // بناء صفوف الجدول
        const tbody = document.getElementById("results-tbody");
        if (tbody) {
            if (!results || results.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="empty-state">لا توجد نتائج بعد.</td></tr>`;
            } else {
                tbody.innerHTML = results.map((item) => {
                    const pct = typeof item.percentage === "number" ? item.percentage.toFixed(1) : "0.0";
                    const pctBar = typeof item.percentage === "number" ? item.percentage.toFixed(1) : "0";
                    const pctInt = typeof item.percentage === "number" ? Math.round(item.percentage) : 0;
                    const photoSrc = escapeHtml((item.photo || "").replace(/^\/+/, ""));
                    const winnerClass = item.isWinner ? "winner-row" : "";
                    const rankCell = item.isWinner
                        ? `<span class="winner-badge"><i class="fa-solid fa-trophy" aria-hidden="true"></i> فائز</span>`
                        : `<span style="color:var(--text-muted)">—</span>`;

                    return `
                    <tr class="${winnerClass}">
                        <td>
                            <div class="candidate-cell">
                                <img src="/${photoSrc}" alt="صورة ${escapeHtml(item.name)}">
                                <span>${escapeHtml(item.name)}</span>
                            </div>
                        </td>
                        <td><strong>${escapeHtml(item.voteCount)}</strong></td>
                        <td>${pct}%</td>
                        <td>
                            <div class="bar-wrap" role="progressbar"
                                aria-valuenow="${pctInt}" aria-valuemin="0" aria-valuemax="100">
                                <div class="bar-fill" style="width:${pctBar}%"></div>
                            </div>
                        </td>
                        <td>${rankCell}</td>
                    </tr>`;
                }).join("");
            }
        }

        // إظهار قسم البيانات
        if (dataDiv) dataDiv.hidden = false;
    }

    function showEmpty(message) {
        const loading = document.getElementById("results-loading");
        const empty = document.getElementById("results-empty");

        if (loading) loading.hidden = true;
        if (empty) {
            const p = empty.querySelector("p");
            if (p && message) p.textContent = message;
            empty.hidden = false;
        }
    }

    // ── تشغيل ──────────────────────────────────────────────────────────────────
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadResults);
    } else {
        loadResults();
    }
})();
