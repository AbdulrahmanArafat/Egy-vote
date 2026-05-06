document.addEventListener("DOMContentLoaded", () => {
    const mobileBreakpoint = 640;
    const navs = document.querySelectorAll("nav");
    const backendBaseUrl = "http://127.0.0.1:3000";
    const shouldProxyBackendRoutes = window.location.port !== "3000";

    navs.forEach((nav) => {
        const toggleButton = nav.querySelector(".menu-toggle");
        const linksContainer = nav.querySelector(".links");
        const toggleIcon = toggleButton ? toggleButton.querySelector("i") : null;

        if (!toggleButton || !linksContainer) {
            return;
        }

        const closeMenu = () => {
            nav.classList.remove("menu-open");
            toggleButton.setAttribute("aria-expanded", "false");
            toggleButton.setAttribute("aria-label", "فتح القائمة");

            if (toggleIcon) {
                toggleIcon.classList.remove("fa-xmark");
                toggleIcon.classList.add("fa-bars");
            }
        };

        const openMenu = () => {
            nav.classList.add("menu-open");
            toggleButton.setAttribute("aria-expanded", "true");
            toggleButton.setAttribute("aria-label", "إغلاق القائمة");

            if (toggleIcon) {
                toggleIcon.classList.remove("fa-bars");
                toggleIcon.classList.add("fa-xmark");
            }
        };

        toggleButton.addEventListener("click", (event) => {
            event.stopPropagation();

            if (nav.classList.contains("menu-open")) {
                closeMenu();
                return;
            }

            openMenu();
        });

        linksContainer.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= mobileBreakpoint) {
                    closeMenu();
                }
            });
        });

        document.addEventListener("click", (event) => {
            if (window.innerWidth <= mobileBreakpoint && !nav.contains(event.target)) {
                closeMenu();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > mobileBreakpoint) {
                closeMenu();
            }
        });

        closeMenu();
    });

    // When opened from Live Server (or any non-3000 origin), backend routes
    // like /admin/login and /results must be redirected to the Express server.
    if (shouldProxyBackendRoutes) {
        document.querySelectorAll("a[href^='/']").forEach((anchor) => {
            anchor.addEventListener("click", (event) => {
                const targetPath = anchor.getAttribute("href");
                if (!targetPath) {
                    return;
                }
                event.preventDefault();
                window.location.href = `${backendBaseUrl}${targetPath}`;
            });
        });
    }
});
