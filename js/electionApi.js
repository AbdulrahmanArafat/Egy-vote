(function () {
    const STORAGE_KEYS = {
        pendingVerification: "egyVote.pendingVerification",
        verifiedSession: "egyVote.verifiedSession",
        voteReceipt: "egyVote.voteReceipt"
    };
    function getApiBaseUrl() {
        if (window.location.protocol === "file:") {
            return "http://127.0.0.1:3000";
        }

        const isLocalhost = ["127.0.0.1", "localhost"].includes(window.location.hostname);
        if (isLocalhost && window.location.port && window.location.port !== "3000") {
            return "http://127.0.0.1:3000";
        }

        return "";
    }

    const API_BASE_URL = getApiBaseUrl();

    function readStorage(key) {
        const value = sessionStorage.getItem(key);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            sessionStorage.removeItem(key);
            return null;
        }
    }

    function writeStorage(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    async function request(path, options = {}) {
        const {
            headers: customHeaders = {},
            ...restOptions
        } = options;

        let response;

        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                ...restOptions,
                headers: {
                    "Content-Type": "application/json",
                    ...customHeaders
                }
            });
        } catch (error) {
            if (window.location.protocol === "file:") {
                throw new Error("افتح الواجهة من خلال Live Server أو أي سيرفر محلي، ولا تفتح ملف HTML مباشرة.");
            }

            throw new Error("تعذر الاتصال بسيرفر الـ API. إذا كنت تستخدم Live Server فشغل الباك إند أيضًا عن طريق npm start أو node server.js على http://127.0.0.1:3000.");
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "حدث خطأ غير متوقع.");
        }

        return data;
    }

    function getAuthorizationHeaders() {
        const session = readStorage(STORAGE_KEYS.verifiedSession);

        if (!session || !session.token) {
            return {};
        }

        return {
            Authorization: `Bearer ${session.token}`
        };
    }

    window.EgyVoteApi = {
        async requestOtp(nationalId) {
            return request("/api/auth/request-otp", {
                method: "POST",
                body: JSON.stringify({ nationalId })
            });
        },

        async verifyOtp(nationalId, otp) {
            return request("/api/auth/verify-otp", {
                method: "POST",
                body: JSON.stringify({ nationalId, otp })
            });
        },

        async getCandidates() {
            return request("/api/candidates", {
                method: "GET",
                headers: getAuthorizationHeaders()
            });
        },

        async submitVote(candidateId) {
            return request("/api/votes", {
                method: "POST",
                headers: getAuthorizationHeaders(),
                body: JSON.stringify({ candidateId })
            });
        },

        setPendingVerification(data) {
            writeStorage(STORAGE_KEYS.pendingVerification, data);
        },

        getPendingVerification() {
            return readStorage(STORAGE_KEYS.pendingVerification);
        },

        clearPendingVerification() {
            sessionStorage.removeItem(STORAGE_KEYS.pendingVerification);
        },

        setVerifiedSession(data) {
            writeStorage(STORAGE_KEYS.verifiedSession, data);
        },

        getVerifiedSession() {
            return readStorage(STORAGE_KEYS.verifiedSession);
        },

        clearVerifiedSession() {
            sessionStorage.removeItem(STORAGE_KEYS.verifiedSession);
        },

        setVoteReceipt(data) {
            writeStorage(STORAGE_KEYS.voteReceipt, data);
        },

        getVoteReceipt() {
            return readStorage(STORAGE_KEYS.voteReceipt);
        },

        clearVoteReceipt() {
            sessionStorage.removeItem(STORAGE_KEYS.voteReceipt);
        }
    };
})();
