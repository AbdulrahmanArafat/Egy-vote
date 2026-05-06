const Candidate = require("../models/Candidate");
const Voter = require("../models/Voter");
const { voterSeeds, candidateSeeds } = require("../data/seedData");

async function seedDatabase() {
    // إضافة الناخبين الأساسيين فقط إذا لم يكونوا موجودين — لا نُعيد كتابة has_voted أبداً
    for (const [index, voterSeed] of voterSeeds.entries()) {
        const existingVoter = await Voter.findOne({ national_id: voterSeed.national_id });

        if (!existingVoter) {
            await Voter.create({
                name: voterSeed.name,
                email: voterSeed.email,
                national_id: voterSeed.national_id,
                has_voted: false,
                student_id: voterSeed.student_id || `STD-${String(index + 1).padStart(4, "0")}`,
                status: voterSeed.status || "approved",
                is_verified: typeof voterSeed.is_verified === "boolean" ? voterSeed.is_verified : true,
                verification_method: voterSeed.verification_method || "otp",
                failed_login_attempts: 0,
                notes: voterSeed.notes || "",
                security_flags: voterSeed.security_flags || [],
                approved_at: new Date()
            });
        } else {
            // تحديث البيانات الأساسية فقط — بدون المساس بـ has_voted
            await Voter.updateOne(
                { national_id: voterSeed.national_id },
                {
                    $set: {
                        name: voterSeed.name,
                        email: voterSeed.email,
                        student_id: existingVoter.student_id || voterSeed.student_id || `STD-${String(index + 1).padStart(4, "0")}`,
                        status: voterSeed.status || "approved"
                    }
                }
            );
        }
    }

    // إضافة المرشحين الأساسيين إذا لم يكونوا موجودين فقط
    for (const candidateSeed of candidateSeeds) {
        const existingCandidate = await Candidate.findOne({ name: candidateSeed.name });

        if (!existingCandidate) {
            await Candidate.create({
                name: candidateSeed.name,
                age: candidateSeed.age,
                number_of_votes: 0,
                photo: candidateSeed.photo,
                bio: candidateSeed.bio || "",
                manifesto: candidateSeed.manifesto || "",
                status: candidateSeed.status || "approved"
            });
        } else {
            // تحديث البيانات فقط — بدون المساس بعدد الأصوات
            await Candidate.updateOne(
                { name: candidateSeed.name },
                {
                    $set: {
                        age: candidateSeed.age,
                        photo: candidateSeed.photo,
                        bio: candidateSeed.bio || "",
                        manifesto: candidateSeed.manifesto || "",
                        status: candidateSeed.status || "approved"
                    }
                }
            );
        }
    }

    console.log("✅ بيانات السيد (Seed) جاهزة.");
}

module.exports = { seedDatabase };
