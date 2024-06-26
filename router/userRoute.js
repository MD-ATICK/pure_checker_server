const express = require("express");
const user = require("../controllers/user");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

// user
router.get("/auth", userAuthorize, user.auth);
router.get("/block/:_id", userAuthorize, user.block);
router.post("/register", user.register);
router.post("/login", user.login);
router.delete("/delete", user.deleteMany);
router.get("/getUsers", userAuthorize, user.getMany);
router.put("/update-pass", userAuthorize, user.updatePass);
router.put("/update-profile", userAuthorize, user.updateProfile);

//  ip
router.get("/ip-free-credit", user.ip);

// plan
router.post("/create-plan", user.createPlan);
router.get("/get-plan", user.getPlan);
router.post("/buy-plan", userAuthorize, user.buyPlan);
// router.get("/subscription", userAuthorize, user.subscription);

// api
router.get("/get-api", userAuthorize, user.getApis);
router.post("/create-api", userAuthorize, user.createApi);


// payment
router.get('/payments' , userAuthorize , user.getPayments)

module.exports = router;
