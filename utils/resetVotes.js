/**
 * resetVotes.js
 * ─────────────
 * يُعيد تعيين جميع الأصوات: has_voted → false، يحذف سجلات Vote،
 * ويُصفّر عدد أصوات المرشحين، ثم يُزامن seedData.js.
 *
 * الاستخدام: node utils/resetVotes.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Voter = require("../models/Voter");
const Vote = require("../models/Vote");
const Candidate = require("../models/Candidate");
const { syncSeedDataState } = require("../services/syncSeedVoterState");

async function resetVotes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/egy-vote");
        console.log("✅ متصل بـ MongoDB");

        const voterResult = await Voter.updateMany(
            {},
            { $set: { has_voted: false, last_vote_at: null } }
        );
        console.log(`✅ الناخبون: تم إعادة تعيين ${voterResult.modifiedCount} ناخب`);

        const voteResult = await Vote.deleteMany({});
        console.log(`✅ الأصوات: تم حذف ${voteResult.deletedCount} صوت`);

        const candResult = await Candidate.updateMany({}, { $set: { number_of_votes: 0 } });
        console.log(`✅ المرشحون: تم إعادة تعيين ${candResult.modifiedCount} مرشح`);

        await syncSeedDataState();
        console.log("✅ تم تحديث seedData.js");

        console.log("\n🎉 تم إعادة التعيين بنجاح — جميع الناخبين يمكنهم التصويت من جديد.");
    } catch (error) {
        console.error("❌ خطأ:", error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 تم قطع الاتصال بـ MongoDB");
    }
}

resetVotes();
