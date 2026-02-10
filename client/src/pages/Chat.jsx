import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { playNotificationSound, showNotification, requestNotificationPermission } from "../utils/notification";

const Chat = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const { socket } = useSocket();

    // Request notification permission on load
    useEffect(() => {
        requestNotificationPermission();
    }, []);

    // Global message listener for notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            // Play sound for all incoming messages
            // But checking if it is from the current selected user to avoid double noise if we want
            // For now, simple logic: Play sound always
            playNotificationSound();

            const isChatOpen = selectedUser?._id === newMessage.senderId;
            const isWindowFocused = document.visibilityState === "visible";

            // Show notification if chat is not open OR window is hidden
            if (!isChatOpen || !isWindowFocused) {
                showNotification(`New message from ${newMessage.senderId}`, {
                    body: newMessage.message,
                    tag: newMessage.senderId // Prevent stacking same user notifications
                });
            }
        };

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, selectedUser]);

    return (

        <div className="h-screen flex bg-[#121212]">
            <div className={`w-full md:w-[30%] md:min-w-[320px] md:max-w-[400px] ${selectedUser ? "hidden md:flex" : "flex"} h-full`}>
                <Sidebar selectedUser={selectedUser} onSelectUser={setSelectedUser} />
            </div>
            <div className={`w-full md:w-[70%] ${!selectedUser ? "hidden md:flex" : "flex"} h-full`}>
                <ChatWindow
                    selectedUser={selectedUser}
                    onBack={() => setSelectedUser(null)}
                />
            </div>
        </div>
    );
};

export default Chat;
