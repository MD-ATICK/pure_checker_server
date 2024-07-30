const express = require("express");
const user = require("../controllers/user");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/auth", userAuthorize, user.auth);
router.post("/register", user.register); // email auth
router.post("/login", user.login); // email auth
router.post("/googleLogin", user.googleLogin);
router.get("/ip-free-credit", user.authByIp);
router.put("/update-password", userAuthorize, user.updatePassword); // todo : edited pass to password
router.put("/update-profile", userAuthorize, user.updateProfile);

module.exports = router;
