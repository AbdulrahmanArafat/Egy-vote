(function () {
    const STORAGE_KEY = "egyVote.adminLoggedIn";
    const ADMIN_EMAIL = "abnra3838@gmail.com";
    const ADMIN_PASSWORD = "R3R3@3838";

    function isLoggedIn() {
        return localStorage.getItem(STORAGE_KEY) === "true";
    }

    function setLoggedIn() {
        localStorage.setItem(STORAGE_KEY, "true");
    }

    function clearLoggedIn() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function isLoginPage() {
        return window.location.pathname === "/admin/login";
    }

    function isAdminPage() {
        return window.location.pathname === "/admin";
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (isAdminPage() && !isLoggedIn()) {
            window.location.replace("/admin/login");
            return;
        }

        if (isLoginPage() && isLoggedIn()) {
            window.location.replace("/admin");
            return;
        }

        const loginForm = document.getElementById("adminLoginForm");
        if (loginForm) {
            const emailInput = document.getElementById("adminEmail");
            const passwordInput = document.getElementById("adminPassword");
            const errorBox = document.getElementById("adminError");

            loginForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const email = String(emailInput.value || "").trim().toLowerCase();
                const password = String(passwordInput.value || "");

                if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                    setLoggedIn();
                    window.location.replace("/admin");
                    return;
                }

                errorBox.classList.add("visible");
            });
        }

        const logoutButton = document.getElementById("adminLogoutBtn");
        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                clearLoggedIn();
                window.location.replace("/admin/login");
            });
        }
    });
})();
