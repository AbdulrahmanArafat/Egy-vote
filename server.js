const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const { connectToDatabase } = require("./config/db");
const { seedDatabase } = require("./services/seedDatabase");
const { bootstrapAdminPlatform } = require("./services/admin/bootstrapService");
const electionRoutes = require("./routes/electionRoutes");
const candidateRoutes = require("./routes/admin/candidateRoutes");
const voterRoutes = require("./routes/admin/voterRoutes");
const electionControlRoutes = require("./routes/admin/electionControlRoutes");
const { isEmailConfigured } = require("./services/emailOtp");
const { apiLimiter } = require("./middleware/rateLimiter");


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ─── Security ─────────────────────────────────────────────────────────────────
app.disable("x-powered-by");

// ─── CORS / Cache headers ─────────────────────────────────────────────────────
app.use((request, response, next) => {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
        return response.sendStatus(204);
    }
    return next();
});

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Static files ─────────────────────────────────────────────────────────────
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/images", express.static(path.join(__dirname, "images")));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api", apiLimiter, electionRoutes);
app.use("/api/admin/candidates", candidateRoutes);
app.use("/api/admin/voters", voterRoutes);
app.use("/api/admin/election", electionControlRoutes);

// ─── Admin HTML pages ─────────────────────────────────────────────────────────
app.get("/admin/login", (request, response) => {
    response.sendFile(path.join(__dirname, "html/admin/login.html"));
});

app.get("/admin", (request, response) => {
    response.sendFile(path.join(__dirname, "html/admin/dashboard.html"));
});

// ─── Public pages — clean URLs ────────────────────────────────────────────────
app.get("/about", (request, response) => {
    response.sendFile(path.join(__dirname, "html/about.html"));
});

app.get("/how-to-vote", (request, response) => {
    response.sendFile(path.join(__dirname, "html/howToVote.html"));
});

app.get("/faq", (request, response) => {
    response.sendFile(path.join(__dirname, "html/qustions.html"));
});

app.get("/contact", (request, response) => {
    response.sendFile(path.join(__dirname, "html/contactUs.html"));
});

app.get("/vote", (request, response) => {
    response.sendFile(path.join(__dirname, "html/logIn.html"));
});

app.get("/otp", (request, response) => {
    response.sendFile(path.join(__dirname, "html/otp.html"));
});

app.get("/candidates", (request, response) => {
    response.sendFile(path.join(__dirname, "html/candidates.html"));
});

// ─── Main (index) page ───────────────────────────────────────────────────────
app.get("/", (request, response) => {
    response.sendFile(path.join(__dirname, "index.html"));
});

// ─── Results page ─────────────────────────────────────────────────────────────
app.get("/results", (request, response) => {
    response.sendFile(path.join(__dirname, "html/results.html"));
});

// ─── JSON error handler ───────────────────────────────────────────────────────
app.use((error, request, response, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return response.status(400).json({ message: "جسم الطلب ليس JSON صحيحًا." });
    }
    if (error.code === "LIMIT_FILE_SIZE") {
        return response.status(400).json({ message: "حجم الملف يتجاوز الحد المسموح به (5 ميغابايت)." });
    }
    if (error.message && error.message.includes("نوع الملف")) {
        return response.status(400).json({ message: error.message });
    }
    return next(error);
});

// ─── Server start ─────────────────────────────────────────────────────────────
async function startServer() {
    try {
        await connectToDatabase();
        await seedDatabase();
        await bootstrapAdminPlatform();

        if (isEmailConfigured()) {
            console.log("✅ البريد الإلكتروني مفعّل — سيتم إرسال OTP عبر البريد.");
        } else {
            console.log("⚠️  البريد الإلكتروني غير مهيّأ — تحقق من إعدادات .env");
        }

        if (process.env.VERCEL !== "1") {
            app.listen(port, () => {
                console.log(`🚀 خادم Egy Vote يعمل على http://localhost:${port}`);
            });
        }
    } catch (error) {
        console.error("❌ فشل تشغيل الخادم:", error);
        if (process.env.VERCEL !== "1") {
            process.exit(1);
        }
    }
}

startServer();

module.exports = app;
