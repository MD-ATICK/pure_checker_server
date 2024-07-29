const express = require("express");
const payment = require("../controllers/payment");
const { userAuthorize } = require("../utils/utils");
const router = express.Router();

router.get("/payments", userAuthorize, payment.getPayments);
router.get("/all-payments", payment.getAllPayments); // add

module.exports = router;
