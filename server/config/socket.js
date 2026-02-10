const { Server } = require("socket.io");

let io;
const onlineUsers = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId && userId !== "undefined") {
            onlineUsers.set(userId, socket.id);
            console.log(`✅ User connected: ${userId} -> ${socket.id}`);
        }

        // Broadcast online users to all clients
        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

        // ─── Disconnect ───

        socket.on("disconnect", () => {
            if (userId) {
                onlineUsers.delete(userId);
                console.log(`🔴 User disconnected: ${userId}`);
            }
            io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
        });
    });

    return io;
};

const getIO = () => io;
const getOnlineUsers = () => onlineUsers;

module.exports = { initSocket, getIO, getOnlineUsers };
