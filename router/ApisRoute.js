const express = require("express");
const apis = require("../controllers/apis");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/get-api", userAuthorize , apis.getApis);
router.post("/create-api", userAuthorize, apis.createApi);
router.get("/total-mail-check", apis.totalMailCheck);

module.exports = router;
