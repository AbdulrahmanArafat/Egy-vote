const fs = require("fs/promises");
const path = require("path");
const Candidate = require("../models/Candidate");
const Voter = require("../models/Voter");

const seedDataFilePath = path.join(__dirname, "..", "data", "seedData.js");

function formatValue(value) {
    if (typeof value === "string") {
        return JSON.stringify(value);
    }
    if (Array.isArray(value) || (value && typeof value === "object")) {
        return JSON.stringify(value);
    }
    return String(value);
}

function formatObject(properties, indent = "    ") {
    return Object.entries(properties)
        .map(([key, value]) => `${indent}${key}: ${formatValue(value)}`)
        .join(",\n");
}

function formatObjectArray(name, items) {
    if (!items.length) {
        return `const ${name} = [];`;
    }
    const formattedItems = items
        .map((item) => `    {\n${formatObject(item, "        ")}\n    }`)
        .join(",\n");
    return `const ${name} = [\n${formattedItems}\n];`;
}

function buildSeedDataFileContent(currentVoterSeeds, currentCandidateSeeds) {
    return `${formatObjectArray("voterSeeds", currentVoterSeeds)}\n\n${formatObjectArray("candidateSeeds", currentCandidateSeeds)}\n\nmodule.exports = {\n    voterSeeds,\n    candidateSeeds\n};\n`;
}

async function syncSeedDataState() {
    try {
        const voters = await Voter.find({}).sort({ createdAt: 1 }).lean();
        const candidates = await Candidate.find({}).sort({ createdAt: 1 }).lean();

        const nextFile = buildSeedDataFileContent(
            voters.map((voter) => ({
                name: voter.name,
                has_voted: voter.has_voted,
                national_id: voter.national_id,
                email: voter.email,
                student_id: voter.student_id || "",
                status: voter.status || "approved",
                is_verified: Boolean(voter.is_verified),
                verification_method: voter.verification_method || "otp",
                failed_login_attempts: voter.failed_login_attempts || 0,
                notes: voter.notes || "",
                security_flags: voter.security_flags || []
            })),
            candidates.map((candidate) => ({
                name: candidate.name,
                age: candidate.age,
                number_of_votes: candidate.number_of_votes,
                photo: candidate.photo,
                bio: candidate.bio || "",
                manifesto: candidate.manifesto || "",
                status: candidate.status || "approved"
            }))
        );

        await fs.writeFile(seedDataFilePath, nextFile, "utf8");
    } catch (error) {
        console.error("sync-seed-data-state error:", error);
    }
}

module.exports = { syncSeedDataState };
