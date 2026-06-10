const Candidate = require("../../models/Candidate");
const Election = require("../../models/Election");
const { slugify } = require("../../utils/adminHelpers");

async function ensureDefaultElection() {
    const candidates = await Candidate.find({ status: "approved" }).sort({ createdAt: 1 }).lean();
    const defaultSlug = slugify("egy-vote-default-election");
    let election = await Election.findOne({ slug: defaultSlug });

    if (!election) {
        const now = new Date();
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(now.getFullYear() + 1);

        election = await Election.create({
            title: "انتخابات رئاسة جمهورية مصر العربية",
            slug: defaultSlug,
            description: "انتخابات الجولة الرئاسية على منصة Egy Vote.",
            category: "Presidential",
            start_at: now,
            end_at: oneYearLater,
            status: "active",
            candidate_ids: candidates.map((c) => c._id),
            is_default_seed: true,
            is_results_visible: false,
            allow_live_results: false
        });
    } else {
        // تحديث العنوان إذا تغيّر
        election.title = "انتخابات رئاسة جمهورية مصر العربية";

        // إضافة أي مرشح جديد لم يُضف بعد للانتخابات
        const existingIds = election.candidate_ids.map(String);
        const newCandidates = candidates.filter((c) => !existingIds.includes(String(c._id)));

        if (newCandidates.length) {
            election.candidate_ids.push(...newCandidates.map((c) => c._id));
        }

        await election.save();
    }

    // ربط الانتخابات بكل مرشح معتمد
    if (candidates.length) {
        await Candidate.updateMany(
            { _id: { $in: candidates.map((c) => c._id) } },
            { $addToSet: { election_ids: election._id } }
        );
    }

    return election;
}

async function bootstrapAdminPlatform() {
    await ensureDefaultElection();
}

module.exports = { bootstrapAdminPlatform };
