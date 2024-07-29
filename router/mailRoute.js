const express = require("express");
const mail = require("../controllers/mail");
const router = express.Router();

router.get("/emailAuthCheck/:token", mail.emailAuthCheck);
router.post("/mail-sent", mail.mailSent);
router.post("/contact-mail", mail.contactUSMail);
router.post("/verify-mail-sent/", mail.verifyMailSent);
router.post("/forget-password/:token", mail.forgetPassword);

module.exports = router;
