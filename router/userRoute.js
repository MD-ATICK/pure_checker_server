const express = require("express");
const user = require("../controllers/user");
const { userAuthorize } = require("../utils/utils");
const Volume = require("../controllers/Volume");
const router = express.Router();

// user
router.get("/auth", userAuthorize, user.auth);
router.get("/emailAuthCheck/:token", user.emailAuthCheck);
router.post("/register", user.register); // email auth
router.post("/login", user.login); // email auth
router.post("/googleLogin", user.googleLogin);
router.delete("/delete", user.deleteMany);
router.get("/getUsers", userAuthorize, user.getMany);
router.put("/update-pass", userAuthorize, user.updatePass);
router.put("/update-profile", userAuthorize, user.updateProfile);
router.get("/block/:_id", user.block);
router.post("/add-user", user.addUser); // email auth
router.post("/adjust/:_id", user.adjustUser);

// user 2 step authentication
router.get("/otpSent/:email", user.sendOTP);
router.post("/verifyOTP", user.verifyOTP);

//  ip
router.get("/ip-free-credit", user.authByIp);

// plan
router.get("/get-volume", Volume.get);
router.post("/create-volume", userAuthorize, Volume.add);
router.put("/update-volume", userAuthorize, Volume.update);
router.delete("/delete-volume/:_id", userAuthorize, Volume.delete);
router.post("/buy-plan", userAuthorize, user.buyPlan);
// router.get("/subscription", userAuthorize, user.subscription);

// api
router.get("/get-api", userAuthorize, user.getApis);
router.post("/create-api", userAuthorize, user.createApi);
router.get("/total-mail-check", user.totalMailCheck); // add

// payment
router.get("/payments", userAuthorize, user.getPayments);
router.get("/all-payments", user.getAllPayments); // add

// mail sent
router.post("/mail-sent", user.mailSent);
router.post("/contactUs", user.contactUSMail);
router.post("/verify-mail-sent/", user.verifyMailSent);
router.post("/forget-password/:token", user.forgetPassword);


module.exports = router;
