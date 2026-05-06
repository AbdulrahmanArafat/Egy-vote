const express = require("express");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const Vote = require("../models/Vote");
const Voter = require("../models/Voter");
const {
    createOtpSession,
    verifyOtpSession,
    getVerifiedSession,
    clearVerifiedSession,
    clearSessionsForNationalId
} = require("../services/otpStore");
const {
    isEmailConfigured,
    sendOtpViaEmail
} = require("../services/emailOtp");
const { syncSeedDataState } = require("../services/syncSeedVoterState");
const {
    createSecurityEvent,
    getRequestMeta,
    incrementFailedVoterLogin,
    markSuccessfulVoterAuth,
    recordDuplicateVoteAttempt
} = require("../services/admin/securityService");

const router = express.Router();

function isValidNationalId(value) {
    return /^\d{14}$/.test(value);
}

function normalizeCandidatePhotoPath(photo) {
    return String(photo || "").replace(/\.svg(\?.*)?$/i, ".png$1");
}

function extractToken(request) {
    const authorizationHeader = request.headers.authorization || "";
    if (authorizationHeader.startsWith("Bearer ")) {
        return authorizationHeader.slice(7).trim();
    }
    return "";
}

async function getVotingElection() {
    let election = await Election.findOne({ status: "active" });
    if (!election) {
        election = await Election.findOne({ is_default_seed: true });
    }
    return election;
}

async function requireVerifiedSession(request, response, next) {
    const token = extractToken(request);
    if (!token) {
        return response.status(401).json({
            message: "يجب التحقق من رمز OTP قبل التصويت."
        });
    }
    const session = await getVerifiedSession(token);
    if (!session) {
        return response.status(401).json({
            message: "انتهت صلاحية جلسة التحقق. يرجى البدء من جديد."
        });
    }
    request.verificationToken = token;
    request.verificationSession = session;
    return next();
}

// ─── طلب OTP ──────────────────────────────────────────────────────────────────
router.post("/auth/request-otp", async (request, response) => {
    try {
        const nationalId = String(request.body.nationalId || "").trim();

        if (!isValidNationalId(nationalId)) {
            await incrementFailedVoterLogin({
                nationalId,
                request,
                reason: "تنسيق رقم قومي غير صحيح."
            });
            return response.status(400).json({
                message: "الرقم القومي يجب أن يتكون من 14 رقمًا بالضبط."
            });
        }

        const voter = await Voter.findOne({ national_id: nationalId });

        if (!voter) {
            await incrementFailedVoterLogin({
                nationalId,
                request,
                reason: "رقم قومي غير مسجّل."
            });
            return response.status(404).json({
                message: "هذا الرقم القومي غير مسجّل في قاعدة بيانات الناخبين."
            });
        }

        if (voter.status === "blocked") {
            await createSecurityEvent({
                type: "blocked_login_attempt",
                severity: "high",
                message: "ناخب محظور حاول طلب OTP.",
                voterId: voter._id,
                nationalId,
                ...getRequestMeta(request)
            });
            return response.status(403).json({
                message: "هذا الحساب محظور من المشاركة في التصويت."
            });
        }

        if (["pending", "rejected"].includes(voter.status)) {
            return response.status(403).json({
                message: "هذا الحساب لم يُعتمد بعد للمشاركة في التصويت."
            });
        }

        if (voter.has_voted) {
            await clearSessionsForNationalId(nationalId);
            await syncSeedDataState(voter.national_id);
            await recordDuplicateVoteAttempt(voter, request, { stage: "request-otp" });
            return response.status(409).json({
                message: "لقد قمت بالتصويت مسبقاً.",
                alreadyVoted: true
            });
        }

        const votingElection = await getVotingElection();

        if (!votingElection || votingElection.status !== "active") {
            return response.status(409).json({
                message: "لا توجد انتخابات نشطة حالياً."
            });
        }

        const otpSession = await createOtpSession(voter);

        if (!isEmailConfigured()) {
            return response.status(503).json({
                message: "خدمة البريد الإلكتروني غير متاحة حالياً. يرجى التواصل مع الإدارة."
            });
        }

        console.log(`[OTP] إرسال إلى ${voter.email}`);
        const sendResult = await sendOtpViaEmail(voter.email, otpSession.otp);

        if (!sendResult.ok) {
            console.error(`[OTP] فشل إرسال البريد: ${sendResult.message}`);
            return response.status(503).json({
                message: "فشل إرسال رمز التحقق. يرجى المحاولة مجدداً."
            });
        }

        return response.json({
            message: `تم إرسال رمز التحقق إلى بريدك الإلكتروني ${otpSession.maskedEmail}`,
            maskedEmail: otpSession.maskedEmail,
            expiresInSeconds: otpSession.expiresInSeconds
        });
    } catch (error) {
        console.error("request-otp error:", error);
        return response.status(500).json({
            message: "حدث خطأ أثناء إنشاء رمز التحقق."
        });
    }
});

// ─── التحقق من OTP ────────────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (request, response) => {
    try {
        const nationalId = String(request.body.nationalId || "").trim();
        const otp = String(request.body.otp || "").trim();

        if (!isValidNationalId(nationalId)) {
            await incrementFailedVoterLogin({
                nationalId,
                request,
                reason: "تنسيق رقم قومي غير صحيح أثناء التحقق من OTP."
            });
            return response.status(400).json({
                message: "الرقم القومي غير صحيح."
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            await incrementFailedVoterLogin({
                nationalId,
                request,
                reason: "تنسيق OTP غير صحيح."
            });
            return response.status(400).json({
                message: "رمز التحقق يجب أن يتكون من 6 أرقام بالضبط."
            });
        }

        const voter = await Voter.findOne({ national_id: nationalId });

        if (!voter) {
            await incrementFailedVoterLogin({
                nationalId,
                request,
                reason: "ناخب غير موجود أثناء التحقق من OTP."
            });
            return response.status(404).json({
                message: "لم يتم العثور على بيانات الناخب."
            });
        }

        if (voter.has_voted) {
            await clearSessionsForNationalId(nationalId);
            await syncSeedDataState(voter.national_id);
            await recordDuplicateVoteAttempt(voter, request, { stage: "verify-otp" });
            return response.status(409).json({
                message: "لقد قمت بالتصويت مسبقاً."
            });
        }

        const verificationResult = await verifyOtpSession(nationalId, otp);

        if (!verificationResult.ok) {
            await incrementFailedVoterLogin({
                nationalId,
                request,
                reason: verificationResult.message
            });
            return response.status(400).json({
                message: verificationResult.message
            });
        }

        await markSuccessfulVoterAuth(voter, request);

        return response.json({
            message: "تم التحقق بنجاح. يمكنك الآن التصويت.",
            token: verificationResult.token,
            voter: {
                name: voter.name,
                nationalId: voter.national_id,
                has_voted: voter.has_voted
            }
        });
    } catch (error) {
        console.error("verify-otp error:", error);
        return response.status(500).json({
            message: "حدث خطأ أثناء التحقق من الرمز."
        });
    }
});

// ─── جلب المرشحين ─────────────────────────────────────────────────────────────
router.get("/candidates", requireVerifiedSession, async (request, response) => {
    try {
        const votingElection = await getVotingElection();
        const candidateFilter = votingElection?.candidate_ids?.length
            ? { _id: { $in: votingElection.candidate_ids }, status: "approved" }
            : { status: "approved" };

        const candidates = await Candidate.find(candidateFilter)
            .sort({ createdAt: 1 })
            .lean();

        return response.json({
            election: votingElection
                ? {
                    id: votingElection._id,
                    title: votingElection.title,
                    status: votingElection.status
                }
                : null,
            candidates: candidates.map((candidate) => ({
                id: candidate._id,
                name: candidate.name,
                age: candidate.age,
                number_of_votes: candidate.number_of_votes,
                photo: normalizeCandidatePhotoPath(candidate.photo)
            }))
        });
    } catch (error) {
        console.error("get-candidates error:", error);
        return response.status(500).json({
            message: "تعذر تحميل قائمة المرشحين."
        });
    }
});

// ─── تسجيل الصوت ─────────────────────────────────────────────────────────────
router.post("/votes", requireVerifiedSession, async (request, response) => {
    try {
        const candidateId = String(request.body.candidateId || "").trim();

        if (!candidateId) {
            return response.status(400).json({
                message: "يجب اختيار مرشح قبل تأكيد التصويت."
            });
        }

        const votingElection = await getVotingElection();

        if (!votingElection || votingElection.status !== "active") {
            return response.status(409).json({
                message: "لا توجد انتخابات نشطة حالياً."
            });
        }

        const candidate = await Candidate.findById(candidateId);

        if (!candidate) {
            return response.status(404).json({
                message: "المرشح المحدد غير موجود."
            });
        }

        if (!votingElection.candidate_ids.map((id) => String(id)).includes(candidateId)) {
            return response.status(400).json({
                message: "هذا المرشح غير مرتبط بالانتخابات الحالية."
            });
        }

        const existingVote = await Vote.findOne({
            voter_id: request.verificationSession.voterId,
            election_id: votingElection._id
        });

        if (existingVote) {
            const voterRecord = await Voter.findById(request.verificationSession.voterId);
            await recordDuplicateVoteAttempt(voterRecord, request, {
                stage: "vote-submit",
                electionId: votingElection._id.toString()
            });
            return response.status(409).json({
                message: "لقد سبق تسجيل صوتك في هذه الانتخابات."
            });
        }

        const voter = await Voter.findOneAndUpdate(
            {
                _id: request.verificationSession.voterId,
                has_voted: false
            },
            {
                $set: {
                    has_voted: true,
                    last_vote_at: new Date()
                }
            },
            { new: true }
        );

        if (!voter) {
            await clearSessionsForNationalId(request.verificationSession.nationalId);
            await recordDuplicateVoteAttempt(
                { _id: request.verificationSession.voterId, national_id: request.verificationSession.nationalId },
                request,
                { stage: "vote-update-voter" }
            );
            return response.status(409).json({
                message: "تم استخدام جلسة التحقق هذه مسبقاً."
            });
        }

        const updatedCandidate = await Candidate.findByIdAndUpdate(
            candidateId,
            { $inc: { number_of_votes: 1 } },
            { new: true }
        );

        if (!updatedCandidate) {
            await Voter.updateOne(
                { _id: request.verificationSession.voterId, has_voted: true },
                { $set: { has_voted: false, last_vote_at: null } }
            );
            await syncSeedDataState(request.verificationSession.nationalId);
            return response.status(404).json({
                message: "تعذر تحديث عداد أصوات المرشح."
            });
        }

        try {
            const { ipAddress, userAgent } = getRequestMeta(request);
            await Vote.create({
                election_id: votingElection._id,
                candidate_id: updatedCandidate._id,
                voter_id: voter._id,
                ip_address: ipAddress,
                user_agent: userAgent
            });
        } catch (voteCreateError) {
            await Promise.all([
                Voter.updateOne(
                    { _id: request.verificationSession.voterId, has_voted: true },
                    { $set: { has_voted: false, last_vote_at: null } }
                ),
                Candidate.updateOne(
                    { _id: updatedCandidate._id },
                    { $inc: { number_of_votes: -1 } }
                )
            ]);

            await createSecurityEvent({
                type: "vote_record_failure",
                severity: "critical",
                message: "فشل حفظ الصوت بعد تحديث العداد.",
                voterId: voter._id,
                nationalId: voter.national_id,
                ...getRequestMeta(request),
                metadata: {
                    candidateId,
                    electionId: votingElection._id.toString(),
                    error: voteCreateError.message
                }
            });

            return response.status(500).json({
                message: "حدث خطأ أثناء حفظ الصوت."
            });
        }

        await syncSeedDataState();
        await clearVerifiedSession(request.verificationToken);
        await clearSessionsForNationalId(request.verificationSession.nationalId);

        return response.json({
            message: `تم تسجيل صوتك بنجاح للمرشح ${updatedCandidate.name}.`,
            candidate: {
                id: updatedCandidate._id,
                name: updatedCandidate.name,
                number_of_votes: updatedCandidate.number_of_votes
            },
            voter: {
                name: voter.name,
                nationalId: voter.national_id,
                has_voted: voter.has_voted
            }
        });
    } catch (error) {
        console.error("vote error:", error);
        return response.status(500).json({
            message: "حدث خطأ أثناء تسجيل الصوت."
        });
    }
});

// ─── حالة الانتخابات العامة (بدون مصادقة) ────────────────────────────────────
router.get("/election/status", async (request, response) => {
    try {
        const activeElection = await Election.findOne({ status: "active" })
            .sort({ createdAt: -1 })
            .select("_id title status start_date end_date")
            .lean();

        const latestClosedElection = await Election.findOne({ status: "ended" })
            .sort({ manually_closed_at: -1, updatedAt: -1 })
            .select("_id title status start_date end_date")
            .lean();

        return response.json({
            activeElection: activeElection || null,
            latestClosedElection: latestClosedElection || null
        });
    } catch (error) {
        console.error("election-status error:", error);
        return response.status(500).json({ message: "تعذر جلب حالة الانتخابات." });
    }
});

// ─── نتائج الانتخابات العامة (بدون مصادقة) ──────────────────────────────────
router.get("/results", async (request, response) => {
    try {
        const election = await Election.findOne({ status: "ended" })
            .sort({ manually_closed_at: -1, updatedAt: -1 })
            .populate("candidate_ids")
            .lean();

        if (!election) {
            return response.json({ election: null, results: [], totalVotes: 0 });
        }

        const votes = await Vote.aggregate([
            { $match: { election_id: election._id } },
            { $group: { _id: "$candidate_id", voteCount: { $sum: 1 } } }
        ]);

        const voteMap = new Map(votes.map((item) => [String(item._id), item.voteCount]));
        const totalVotes = votes.reduce((sum, item) => sum + item.voteCount, 0);

        const sorted = election.candidate_ids
            .map((candidate) => ({
                name: candidate.name,
                photo: normalizeCandidatePhotoPath(candidate.photo),
                voteCount: voteMap.get(String(candidate._id)) || 0
            }))
            .sort((a, b) => b.voteCount - a.voteCount);

        const topVote = sorted.length ? sorted[0].voteCount : 0;

        return response.json({
            election: {
                id: election._id,
                title: election.title,
                status: election.status
            },
            totalVotes,
            results: sorted.map((item) => ({
                ...item,
                percentage: totalVotes === 0 ? 0 : (item.voteCount / totalVotes) * 100,
                isWinner: topVote > 0 && item.voteCount === topVote
            }))
        });
    } catch (error) {
        console.error("results error:", error);
        return response.status(500).json({ message: "تعذر جلب نتائج الانتخابات." });
    }
});

module.exports = router;
