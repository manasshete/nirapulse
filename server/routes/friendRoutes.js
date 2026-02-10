const express = require("express");
const router = express.Router();
const {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getFriendRequests,
    getSentRequests,
    getFriends,
} = require("../controllers/friendController");
const protect = require("../middleware/auth");

router.get("/", protect, getFriends);
router.get("/requests", protect, getFriendRequests);
router.get("/requests/sent", protect, getSentRequests);
router.post("/request/:receiverId", protect, sendRequest);
router.put("/accept/:requestId", protect, acceptRequest);
router.put("/reject/:requestId", protect, rejectRequest);

module.exports = router;
