(function () {
    const candidateForm = document.getElementById("candidateForm");
    const voterForm = document.getElementById("voterForm");
    const candidateBody = document.getElementById("candidatesTableBody");
    const voterBody = document.getElementById("votersTableBody");

    // ── Helpers ───────────────────────────────────────────────────────────────
    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function showNotification(message, type = "info") {
        const box = document.getElementById("adminStatus");
        if (!box) return;
        box.textContent = message;
        box.className = `admin-notification is-${type}`;
        box.hidden = false;
        clearTimeout(box._timer);
        box._timer = setTimeout(() => { box.hidden = true; }, 5000);
    }

    async function apiRequest(path, options = {}) {
        const response = await fetch(path, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "حدث خطأ في الطلب.");
        return data;
    }

    // ── Election Control ───────────────────────────────────────────────────────
    async function loadElectionStatus() {
        try {
            const election = await apiRequest("/api/admin/election");
            const statusEl = document.getElementById("electionStatusText");
            const openBtn = document.getElementById("openElectionBtn");
            const closeBtn = document.getElementById("closeElectionBtn");
            const resetBtn = document.getElementById("resetVotesBtn");

            if (!election) {
                statusEl.textContent = "لا توجد انتخابات";
                statusEl.className = "election-status-badge is-unknown";
                return;
            }

            const statusMap = {
                active: { label: "مفتوحة الآن", cls: "is-active" },
                ended: { label: "مغلقة / انتهت", cls: "is-ended" },
                draft: { label: "مسودة", cls: "is-draft" },
                upcoming: { label: "قادمة", cls: "is-upcoming" },
                archived: { label: "مؤرشفة", cls: "is-archived" }
            };

            const info = statusMap[election.status] || { label: election.status, cls: "" };
            statusEl.textContent = `${election.title} — ${info.label}`;
            statusEl.className = `election-status-badge ${info.cls}`;

            const isActive = election.status === "active";
            openBtn.disabled = isActive;
            closeBtn.disabled = !isActive;
            resetBtn.disabled = false;
        } catch (error) {
            showNotification(error.message, "error");
        }
    }

    function bindElectionButtons() {
        const openBtn = document.getElementById("openElectionBtn");
        const closeBtn = document.getElementById("closeElectionBtn");
        const resetBtn = document.getElementById("resetVotesBtn");

        if (openBtn) {
            openBtn.addEventListener("click", async () => {
                if (!confirm("هل تريد فتح الانتخابات؟")) return;
                try {
                    await apiRequest("/api/admin/election/open", { method: "POST" });
                    showNotification("تم فتح الانتخابات بنجاح.", "success");
                    await loadElectionStatus();
                } catch (error) {
                    showNotification(error.message, "error");
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", async () => {
                if (!confirm("هل تريد إغلاق الانتخابات؟ سيتم عرض النتائج للزوار.")) return;
                try {
                    await apiRequest("/api/admin/election/close", { method: "POST" });
                    showNotification("تم إغلاق الانتخابات وإتاحة النتائج.", "success");
                    await loadElectionStatus();
                } catch (error) {
                    showNotification(error.message, "error");
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", async () => {
                if (!confirm("تحذير: سيتم حذف جميع الأصوات وإعادة has_voted إلى false لجميع الناخبين. هل أنت متأكد؟")) return;
                try {
                    await apiRequest("/api/admin/election/reset", { method: "POST" });
                    showNotification("تم إعادة تعيين جميع الأصوات بنجاح.", "success");
                    await loadCandidates();
                    await loadVoters();
                } catch (error) {
                    showNotification(error.message, "error");
                }
            });
        }
    }

    // ── Candidates ────────────────────────────────────────────────────────────
    async function loadCandidates() {
        try {
            const candidates = await apiRequest("/api/admin/candidates");
            if (!candidates.length) {
                candidateBody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fa-solid fa-inbox"></i><p>لا يوجد مرشحون بعد</p></td></tr>`;
                return;
            }
            candidateBody.innerHTML = candidates.map((c) => `
                <tr>
                    <td>${escapeHtml(c.name)}</td>
                    <td>${escapeHtml(c.age)}</td>
                    <td>${escapeHtml(c.number_of_votes ?? 0)}</td>
                    <td class="table-actions">
                        <button class="btn btn-secondary" data-action="edit-candidate" data-id="${c._id}" data-name="${escapeHtml(c.name)}" data-age="${escapeHtml(c.age)}" data-photo="${escapeHtml(c.photo)}" data-bio="${escapeHtml(c.bio)}" data-manifesto="${escapeHtml(c.manifesto)}">
                            <i class="fa-solid fa-pen-to-square"></i> تعديل
                        </button>
                        <button class="btn btn-danger" data-action="delete-candidate" data-id="${c._id}">
                            <i class="fa-solid fa-trash"></i> حذف
                        </button>
                    </td>
                </tr>
            `).join("");
        } catch (error) {
            showNotification(error.message, "error");
        }
    }

    // ── Voters ────────────────────────────────────────────────────────────────
    async function loadVoters() {
        try {
            const voters = await apiRequest("/api/admin/voters");
            if (!voters.length) {
                voterBody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-inbox"></i><p>لا يوجد ناخبون بعد</p></td></tr>`;
                return;
            }
            voterBody.innerHTML = voters.map((v) => `
                <tr>
                    <td>${escapeHtml(v.name)}</td>
                    <td>${escapeHtml(v.national_id)}</td>
                    <td>${escapeHtml(v.email)}</td>
                    <td>
                        <span class="vote-badge ${v.has_voted ? 'voted' : 'not-voted'}">
                            ${v.has_voted ? "صوّت" : "لم يصوّت"}
                        </span>
                    </td>
                    <td class="table-actions">
                        <button class="btn btn-secondary" data-action="edit-voter" data-id="${v._id}" data-name="${escapeHtml(v.name)}" data-national-id="${escapeHtml(v.national_id)}" data-email="${escapeHtml(v.email)}" data-student-id="${escapeHtml(v.student_id)}">
                            <i class="fa-solid fa-pen-to-square"></i> تعديل
                        </button>
                        <button class="btn btn-danger" data-action="delete-voter" data-id="${v._id}">
                            <i class="fa-solid fa-trash"></i> حذف
                        </button>
                    </td>
                </tr>
            `).join("");
        } catch (error) {
            showNotification(error.message, "error");
        }
    }

    // ── Add candidate form ────────────────────────────────────────────────────
    if (candidateForm) {
        candidateForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const payload = {
                name: candidateForm.name.value,
                age: candidateForm.age.value,
                photo: candidateForm.photo.value,
                bio: candidateForm.bio.value,
                manifesto: candidateForm.manifesto.value
            };
            try {
                await apiRequest("/api/admin/candidates", { method: "POST", body: JSON.stringify(payload) });
                candidateForm.reset();
                await loadCandidates();
                showNotification("تم إضافة المرشح بنجاح وربطه بالانتخابات.", "success");
            } catch (error) {
                showNotification(error.message, "error");
            }
        });
    }

    // ── Add voter form ────────────────────────────────────────────────────────
    if (voterForm) {
        voterForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const payload = {
                name: voterForm.name.value,
                national_id: voterForm.national_id.value,
                email: voterForm.email.value,
                student_id: voterForm.student_id.value
            };
            try {
                await apiRequest("/api/admin/voters", { method: "POST", body: JSON.stringify(payload) });
                voterForm.reset();
                await loadVoters();
                showNotification("تم إضافة الناخب بنجاح.", "success");
            } catch (error) {
                showNotification(error.message, "error");
            }
        });
    }

    // ── Table action buttons ──────────────────────────────────────────────────
    document.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const { action, id } = button.dataset;
        if (!id) return;

        try {
            if (action === "delete-candidate") {
                if (!confirm("هل تريد حذف هذا المرشح؟ سيتم حذفه من الانتخابات أيضاً.")) return;
                await apiRequest(`/api/admin/candidates/${id}`, { method: "DELETE" });
                await loadCandidates();
                showNotification("تم حذف المرشح وإزالته من الانتخابات.", "success");

            } else if (action === "delete-voter") {
                if (!confirm("هل تريد حذف هذا الناخب؟")) return;
                await apiRequest(`/api/admin/voters/${id}`, { method: "DELETE" });
                await loadVoters();
                showNotification("تم حذف الناخب.", "success");

            } else if (action === "edit-candidate") {
                const name = prompt("اسم المرشح:", button.dataset.name);
                const age = prompt("العمر:", button.dataset.age);
                const photo = prompt("رابط الصورة:", button.dataset.photo);
                const bio = prompt("السيرة الذاتية:", button.dataset.bio);
                const manifesto = prompt("البرنامج الانتخابي:", button.dataset.manifesto);
                if (!name || !age) return;
                await apiRequest(`/api/admin/candidates/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ name, age, photo: photo || "", bio: bio || "", manifesto: manifesto || "" })
                });
                await loadCandidates();
                showNotification("تم تحديث بيانات المرشح.", "success");

            } else if (action === "edit-voter") {
                const name = prompt("اسم الناخب:", button.dataset.name);
                const national_id = prompt("الرقم القومي:", button.dataset.nationalId);
                const email = prompt("البريد الإلكتروني:", button.dataset.email);
                const student_id = prompt("رقم الطالب:", button.dataset.studentId);
                if (!name || !national_id || !email) return;
                await apiRequest(`/api/admin/voters/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ name, national_id, email, student_id: student_id || "" })
                });
                await loadVoters();
                showNotification("تم تحديث بيانات الناخب.", "success");
            }
        } catch (error) {
            showNotification(error.message, "error");
        }
    });

    // ── Init ──────────────────────────────────────────────────────────────────
    loadElectionStatus();
    bindElectionButtons();
    loadCandidates();
    loadVoters();
})();
