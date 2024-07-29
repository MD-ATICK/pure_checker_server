const express = require("express");
const plan = require("../controllers/plan");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.post("/buy-plan", userAuthorize, plan.buyPlan);
router.get("/subscription", userAuthorize, plan.subscription);

module.exports = router;
