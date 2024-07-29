const express = require("express");
const user = require("../controllers/user");
const { userAuthorize } = require("../utils/utils");
const Volume = require("../controllers/Volume");
const router = express.Router();

// user
router.get("/auth", userAuthorize, user.auth);
router.post("/register", user.register); // email auth
router.post("/login", user.login); // email auth
router.post("/googleLogin", user.googleLogin);
router.get("/ip-free-credit", user.authByIp);
router.put("/update-password", userAuthorize, user.updatePassword); // todo : edited pass to password
router.put("/update-profile", userAuthorize, user.updateProfile);


// done. admin edit.
// router.delete("/delete", user.deleteMany); d
// router.get("/getUsers", userAuthorize, user.getMany);
// router.get("/block/:_id", user.block);
// router.post("/add-user", user.addUser); // email auth
// router.post("/adjust/:_id", user.adjustUser);



// done; user 2 step authentication done ;
// router.get("/otpSent/:email", user.sendOTP);
// router.post("/verifyOTP", user.verifyOTP);


// done : volume
// router.get("/get-volume", Volume.get);
// router.post("/create-volume", userAuthorize, Volume.add);
// router.put("/update-volume", userAuthorize, Volume.update);
// router.delete("/delete-volume/:_id", userAuthorize, Volume.delete);


// done : plan
// router.post("/buy-plan", userAuthorize, user.buyPlan);
// router.get("/subscription", userAuthorize, user.subscription);

// done : apis
// in api route. named "/apis" @@@@ done
// router.get("/get-api", userAuthorize, user.getApis);
// router.post("/create-api", userAuthorize, user.createApi);
// router.get("/total-mail-check", user.totalMailCheck); 


// done: payment ### done
// router.get("/payments", userAuthorize, user.getPayments);
// router.get("/all-payments", user.getAllPayments); // add

// done: mail sent ## done
// router.post("/mail-sent", user.mailSent);
// router.post("/contactUs", user.contactUSMail);
// router.post("/verify-mail-sent/", user.verifyMailSent);
// router.post("/forget-password/:token", user.forgetPassword);
// router.get("/emailAuthCheck/:token", user.emailAuthCheck);



module.exports = router;
