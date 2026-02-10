const Message = require("../models/Message");
const { getIO, getOnlineUsers } = require("../config/socket");
const validator = require("validator");

// @desc    Send a message
// @route   POST /api/messages/send/:receiverId
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { receiverId } = req.params;
        const senderId = req.user._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message content is required" });
        }

        // Sanitize message content
        const sanitizedMessage = validator.trim(message);

        if (!validator.isLength(sanitizedMessage, { min: 1, max: 2000 })) {
            return res
                .status(400)
                .json({ message: "Message must be 1-2000 characters" });
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message: sanitizedMessage,
        });

        // Send real-time message via Socket.io
        const io = getIO();
        const onlineUsers = getOnlineUsers();
        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get messages between two users
// @route   GET /api/messages/:receiverId
const getMessages = async (req, res) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { sendMessage, getMessages };
