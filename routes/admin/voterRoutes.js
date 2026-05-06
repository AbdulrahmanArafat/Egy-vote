const express = require("express");
const router = express.Router();
const { getVoters, createVoter, updateVoter, deleteVoter } = require("../../controllers/admin/voterController");
const { validateVoter } = require("../../middleware/validate");
const { adminLimiter } = require("../../middleware/rateLimiter");

router.use(adminLimiter);

router.get("/", getVoters);
router.post("/", validateVoter, createVoter);
router.put("/:id", validateVoter, updateVoter);
router.delete("/:id", deleteVoter);

module.exports = router;
