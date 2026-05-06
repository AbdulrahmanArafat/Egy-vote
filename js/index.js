// index.js — GSAP animations for the home page
document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // ── Nav slide-in
    gsap.from("#site-header", {
        y: -60, opacity: 0, duration: 0.7, ease: "power2.out"
    });

    // ── Hero content
    gsap.from(".hero-eyebrow", {
        y: 30, opacity: 0, duration: 0.6, delay: 0.2, ease: "power2.out"
    });
    gsap.from(".hero-title", {
        y: 40, opacity: 0, duration: 0.8, delay: 0.35, ease: "power3.out"
    });
    gsap.from(".hero-subtitle", {
        y: 30, opacity: 0, duration: 0.7, delay: 0.5, ease: "power2.out"
    });
    gsap.from(".hero-actions", {
        y: 24, opacity: 0, duration: 0.6, delay: 0.65, ease: "power2.out"
    });
    gsap.from(".hero-visual", {
        x: -40, opacity: 0, duration: 0.9, delay: 0.4, ease: "power3.out"
    });

    // ── Stat counters
    document.querySelectorAll(".stat-number").forEach((el) => {
        const target = parseInt(el.dataset.target, 10);
        ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter() {
                gsap.to({ val: 0 }, {
                    val: target,
                    duration: 1.8,
                    ease: "power2.out",
                    onUpdate() {
                        el.textContent = Math.round(this.targets()[0].val);
                    }
                });
            }
        });
    });

    // ── Stat cards
    gsap.from(".stat-card", {
        scrollTrigger: { trigger: ".stats-section", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power2.out"
    });

    // ── Section headers
    document.querySelectorAll(".section-header").forEach((header) => {
        gsap.from(header.children, {
            scrollTrigger: { trigger: header, start: "top 82%" },
            y: 30, opacity: 0, duration: 0.6, stagger: 0.12, ease: "power2.out"
        });
    });

    // ── Feature cards
    gsap.from(".feature-card", {
        scrollTrigger: { trigger: ".features-grid", start: "top 80%" },
        y: 50, opacity: 0, duration: 0.65, stagger: 0.1, ease: "power2.out"
    });

    // ── Election wrapper
    gsap.from(".election-wrapper", {
        scrollTrigger: { trigger: ".election-section", start: "top 80%" },
        y: 40, opacity: 0, duration: 0.8, ease: "power2.out"
    });

    // ── Steps
    gsap.from(".step-item", {
        scrollTrigger: { trigger: ".steps-row", start: "top 82%" },
        y: 40, opacity: 0, duration: 0.6, stagger: 0.15, ease: "power2.out"
    });

    // ── Footer
    gsap.from("footer", {
        scrollTrigger: { trigger: "footer", start: "top 90%" },
        y: 20, opacity: 0, duration: 0.6, ease: "power2.out"
    });
});
