const express = require("express");
const checker = require("../controllers/checker");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/check", checker.gmailCheck);
router.post("/bulk-check", userAuthorize, checker.bulksCheck);

// for api
router.get("/check/single", checker.singleEmailApi);
router.post("/check/bulk", checker.bulkEmailApi);
module.exports = router;
