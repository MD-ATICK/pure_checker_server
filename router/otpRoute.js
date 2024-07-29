const express = require("express");
const otp = require("../controllers/otp");
const router = express.Router();

router.get("/otpSent/:email", otp.sendOTP);
router.post("/verifyOTP", otp.verifyOTP);

module.exports = router;
