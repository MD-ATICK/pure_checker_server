const express = require("express");
const checker = require("../controllers/checker");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/check", userAuthorize, checker.gmailCheck);
router.get("/check/single", checker.apiCheck);
module.exports = router;
