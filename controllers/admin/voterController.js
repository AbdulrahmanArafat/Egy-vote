const Voter = require("../../models/Voter");
const { syncSeedDataState } = require("../../services/syncSeedVoterState");

async function getVoters(request, response) {
    try {
        const voters = await Voter.find({}).sort({ createdAt: -1 }).lean();
        return response.json(voters);
    } catch (error) {
        return response.status(500).json({ message: "فشل في تحميل الناخبين." });
    }
}

async function createVoter(request, response) {
    try {
        const voter = await Voter.create({
            name: String(request.body.name || "").trim(),
            national_id: String(request.body.national_id || "").trim(),
            email: String(request.body.email || "").trim().toLowerCase(),
            student_id: String(request.body.student_id || "").trim(),
            status: "approved",
            has_voted: false,
            is_verified: true,
            verification_method: "manual",
            approved_at: new Date()
        });

        await syncSeedDataState();

        return response.status(201).json(voter);
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "الرقم القومي موجود بالفعل." });
        }
        return response.status(400).json({ message: "فشل في إنشاء الناخب." });
    }
}

async function updateVoter(request, response) {
    try {
        const updated = await Voter.findByIdAndUpdate(
            request.params.id,
            {
                $set: {
                    name: String(request.body.name || "").trim(),
                    national_id: String(request.body.national_id || "").trim(),
                    email: String(request.body.email || "").trim().toLowerCase(),
                    student_id: String(request.body.student_id || "").trim()
                }
            },
            { new: true }
        ).lean();

        if (!updated) {
            return response.status(404).json({ message: "الناخب غير موجود." });
        }

        await syncSeedDataState();

        return response.json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "الرقم القومي موجود بالفعل." });
        }
        return response.status(400).json({ message: "فشل في تحديث الناخب." });
    }
}

async function deleteVoter(request, response) {
    try {
        const voterId = request.params.id;

        // حذف جميع الأصوات المسجلة لهذا الناخب
        const Vote = require("../../models/Vote");
        await Vote.deleteMany({ voter_id: voterId });

        await Voter.findByIdAndDelete(voterId);

        await syncSeedDataState();

        return response.json({ ok: true });
    } catch (error) {
        return response.status(500).json({ message: "فشل في حذف الناخب." });
    }
}

module.exports = { getVoters, createVoter, updateVoter, deleteVoter };
