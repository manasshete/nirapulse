const express = require("express");
const router = express.Router();
const { sendMessage, getMessages } = require("../controllers/messageController");
const protect = require("../middleware/auth");

router.post("/send/:receiverId", protect, sendMessage);
router.get("/:receiverId", protect, getMessages);

module.exports = router;
