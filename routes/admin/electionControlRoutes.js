const express = require("express");
const router = express.Router();
const Election = require("../../models/Election");
const Voter = require("../../models/Voter");
const Vote = require("../../models/Vote");
const Candidate = require("../../models/Candidate");
const { syncSeedDataState } = require("../../services/syncSeedVoterState");
const { adminLimiter } = require("../../middleware/rateLimiter");

router.use(adminLimiter);

// GET /api/admin/election — جلب حالة الانتخابات الحالية
router.get("/", async (request, response) => {
    try {
        const election = await Election.findOne({}).sort({ createdAt: -1 }).lean();
        return response.json(election || null);
    } catch (error) {
        return response.status(500).json({ message: "فشل في جلب بيانات الانتخابات." });
    }
});

// POST /api/admin/election/open — فتح الانتخابات
router.post("/open", async (request, response) => {
    try {
        const election = await Election.findOne({}).sort({ createdAt: -1 });
        if (!election) {
            return response.status(404).json({ message: "لا توجد انتخابات لفتحها." });
        }

        election.status = "active";
        election.manually_closed_at = null;
        election.is_results_visible = false;
        await election.save();

        return response.json({ ok: true, status: election.status });
    } catch (error) {
        return response.status(500).json({ message: "فشل في فتح الانتخابات." });
    }
});

// POST /api/admin/election/close — إغلاق الانتخابات وإظهار النتائج
router.post("/close", async (request, response) => {
    try {
        const election = await Election.findOne({}).sort({ createdAt: -1 });
        if (!election) {
            return response.status(404).json({ message: "لا توجد انتخابات لإغلاقها." });
        }

        election.status = "ended";
        election.manually_closed_at = new Date();
        election.is_results_visible = true;
        await election.save();

        return response.json({ ok: true, status: election.status });
    } catch (error) {
        return response.status(500).json({ message: "فشل في إغلاق الانتخابات." });
    }
});

// POST /api/admin/election/reset — إعادة تعيين الأصوات (has_voted → false)
router.post("/reset", async (request, response) => {
    try {
        await Voter.updateMany({}, { $set: { has_voted: false, last_vote_at: null } });
        await Vote.deleteMany({});
        await Candidate.updateMany({}, { $set: { number_of_votes: 0 } });
        await syncSeedDataState();

        return response.json({ ok: true, message: "تم إعادة تعيين جميع الأصوات بنجاح." });
    } catch (error) {
        return response.status(500).json({ message: "فشل في إعادة تعيين الأصوات." });
    }
});

module.exports = router;
