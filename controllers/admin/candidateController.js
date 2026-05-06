const Candidate = require("../../models/Candidate");
const Election = require("../../models/Election");
const { syncSeedDataState } = require("../../services/syncSeedVoterState");

async function getCandidates(request, response) {
    try {
        const candidates = await Candidate.find({}).sort({ createdAt: -1 }).lean();
        return response.json(candidates);
    } catch (error) {
        return response.status(500).json({ message: "فشل في تحميل المرشحين." });
    }
}

async function createCandidate(request, response) {
    try {
        let photoPath = String(request.body.photo || "").trim() || "/images/logo.png";

        if (request.file) {
            photoPath = `/images/candidates/${request.file.filename}`;
        }

        const candidate = await Candidate.create({
            name: String(request.body.name || "").trim(),
            age: Number(request.body.age),
            photo: photoPath,
            bio: String(request.body.bio || "").trim(),
            manifesto: String(request.body.manifesto || "").trim(),
            status: "approved"
        });

        // إضافة المرشح لجميع الانتخابات النشطة والافتراضية
        const elections = await Election.find({
            status: { $in: ["active", "upcoming"] }
        });

        for (const election of elections) {
            if (!election.candidate_ids.map(String).includes(String(candidate._id))) {
                election.candidate_ids.push(candidate._id);
                await election.save();
            }
        }

        // إضافة election_ids للمرشح
        const electionIds = elections.map((e) => e._id);
        if (electionIds.length) {
            await Candidate.updateOne(
                { _id: candidate._id },
                { $addToSet: { election_ids: { $each: electionIds } } }
            );
        }

        await syncSeedDataState();

        return response.status(201).json(candidate);
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "اسم المرشح موجود بالفعل." });
        }
        return response.status(400).json({ message: "فشل في إنشاء المرشح." });
    }
}

async function updateCandidate(request, response) {
    try {
        const updates = {
            name: String(request.body.name || "").trim(),
            age: Number(request.body.age),
            bio: String(request.body.bio || "").trim(),
            manifesto: String(request.body.manifesto || "").trim()
        };

        if (request.body.photo) {
            updates.photo = String(request.body.photo).trim();
        }

        if (request.file) {
            updates.photo = `/images/candidates/${request.file.filename}`;
        }

        const updated = await Candidate.findByIdAndUpdate(
            request.params.id,
            { $set: updates },
            { new: true }
        ).lean();

        if (!updated) {
            return response.status(404).json({ message: "المرشح غير موجود." });
        }

        await syncSeedDataState();

        return response.json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return response.status(409).json({ message: "اسم المرشح موجود بالفعل." });
        }
        return response.status(400).json({ message: "فشل في تحديث المرشح." });
    }
}

async function deleteCandidate(request, response) {
    try {
        const candidateId = request.params.id;

        // حذف المرشح من جميع الانتخابات
        await Election.updateMany(
            {},
            { $pull: { candidate_ids: candidateId } }
        );

        // حذف جميع الأصوات المسجلة لهذا المرشح
        const Vote = require("../../models/Vote");
        await Vote.deleteMany({ candidate_id: candidateId });

        await Candidate.findByIdAndDelete(candidateId);

        await syncSeedDataState();

        return response.json({ ok: true });
    } catch (error) {
        return response.status(500).json({ message: "فشل في حذف المرشح." });
    }
}

module.exports = { getCandidates, createCandidate, updateCandidate, deleteCandidate };
