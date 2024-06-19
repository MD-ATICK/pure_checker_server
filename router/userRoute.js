const express = require("express");
const user = require("../controllers/user");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/auth", userAuthorize, user.auth);
// router.get("/subscription", userAuthorize, user.subscription);
router.get("/block/:_id", userAuthorize, user.block);
router.post("/register", user.register);
router.post("/login", user.login);
router.delete("/delete", user.deleteMany);
router.get("/get", userAuthorize, user.getMany);
router.put("/update-pass", userAuthorize, user.updatePass);

router.get("/ip-free-credit", user.ip);
router.post("/create-plan", userAuthorize , user.createPlan);
router.get("/get-plan", user.getPlan);
router.post('/buy-plan', userAuthorize , user.buyPlan)

module.exports = router;
