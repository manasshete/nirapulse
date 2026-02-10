const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const { getIO, getOnlineUsers } = require("../config/socket");

// @desc    Send a friend request
// @route   POST /api/friends/request/:receiverId
const sendRequest = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { receiverId } = req.params;

        if (senderId.toString() === receiverId) {
            return res
                .status(400)
                .json({ message: "Cannot send request to yourself" });
        }

        // Check if already friends
        const user = await User.findById(senderId);
        if (user.friends.includes(receiverId)) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check for existing request in either direction
        const existing = await FriendRequest.findOne({
            $or: [
                { senderId, receiverId, status: "pending" },
                { senderId: receiverId, receiverId: senderId, status: "pending" },
            ],
        });

        if (existing) {
            return res.status(400).json({ message: "Friend request already exists" });
        }

        const request = await FriendRequest.create({ senderId, receiverId });
        const populatedRequest = await FriendRequest.findById(request._id)
            .populate("senderId", "username profilePic")
            .populate("receiverId", "username profilePic");

        // Notify receiver in real-time
        const io = getIO();
        const onlineUsers = getOnlineUsers();
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequestReceived", populatedRequest);
        }

        res.status(201).json(populatedRequest);
    } catch (error) {
        console.error("Send friend request error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Accept a friend request
// @route   PUT /api/friends/accept/:requestId
const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        request.status = "accepted";
        await request.save();

        // Add each other as friends
        await User.findByIdAndUpdate(request.senderId, {
            $addToSet: { friends: request.receiverId },
        });
        await User.findByIdAndUpdate(request.receiverId, {
            $addToSet: { friends: request.senderId },
        });

        // Notify sender in real-time
        const io = getIO();
        const onlineUsers = getOnlineUsers();
        const senderSocketId = onlineUsers.get(request.senderId.toString());

        if (senderSocketId) {
            io.to(senderSocketId).emit("friendRequestAccepted", {
                userId: request.receiverId,
                username: req.user.username,
            });
        }

        res.json({ message: "Friend request accepted" });
    } catch (error) {
        console.error("Accept friend request error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Reject a friend request
// @route   PUT /api/friends/reject/:requestId
const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        request.status = "rejected";
        await request.save();

        res.json({ message: "Friend request rejected" });
    } catch (error) {
        console.error("Reject friend request error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get pending friend requests (received)
// @route   GET /api/friends/requests
const getFriendRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiverId: req.user._id,
            status: "pending",
        }).populate("senderId", "username email profilePic");

        res.json(requests);
    } catch (error) {
        console.error("Get friend requests error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get sent friend requests
// @route   GET /api/friends/requests/sent
const getSentRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            senderId: req.user._id,
            status: "pending",
        }).populate("receiverId", "username email profilePic");

        res.json(requests);
    } catch (error) {
        console.error("Get sent requests error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get friends list
// @route   GET /api/friends
const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate(
            "friends",
            "username email profilePic"
        );
        res.json(user.friends);
    } catch (error) {
        console.error("Get friends error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getFriendRequests,
    getSentRequests,
    getFriends,
};
