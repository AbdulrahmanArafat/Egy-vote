const express = require("express");
const router = express.Router();
const { getCandidates, createCandidate, updateCandidate, deleteCandidate } = require("../../controllers/admin/candidateController");
const { validateCandidate } = require("../../middleware/validate");
const { uploadCandidatePhoto } = require("../../middleware/upload");
const { adminLimiter } = require("../../middleware/rateLimiter");

router.use(adminLimiter);

router.get("/", getCandidates);
router.post("/", uploadCandidatePhoto, validateCandidate, createCandidate);
router.put("/:id", uploadCandidatePhoto, validateCandidate, updateCandidate);
router.delete("/:id", deleteCandidate);

module.exports = router;
