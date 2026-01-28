// =======================================
// FILE: server/routes/ai.js
// =======================================

const express = require("express");
const router = express.Router();

const { chatWithAssistant } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

// User must be logged in to use chatbot
router.post("/chat", protect, chatWithAssistant);

module.exports = router;
