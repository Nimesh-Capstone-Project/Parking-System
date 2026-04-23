const express = require("express");
const { getPayments, processPayment } = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ service: "payment-service", status: "ok" }));
router.post("/payments/process", authenticate, processPayment);
router.get("/payments", authenticate, getPayments);

module.exports = router;

