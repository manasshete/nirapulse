import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/axios";
import MessageInput from "./MessageInput";
import { Send, MoreVertical, Paperclip, Smile, Image as ImageIcon, X, Loader2, MessageCircle, Search, ArrowLeft } from "lucide-react";

const ChatWindow = ({ selectedUser, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { authUser } = useAuth();
    const { socket, onlineUsers } = useSocket();
    const messagesEndRef = useRef(null);

    const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch messages when selecting a user
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/messages/${selectedUser._id}`);
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
            setLoading(false);
        };

        fetchMessages();
    }, [selectedUser]);

    // Listen for incoming messages via Socket.io
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (
                selectedUser &&
                (newMessage.senderId === selectedUser._id ||
                    newMessage.receiverId === selectedUser._id)
            ) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, selectedUser]);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Send message
    const handleSend = async (messageText) => {
        if (!selectedUser) return;
        try {
            const { data } = await api.post(`/messages/send/${selectedUser._id}`, {
                message: messageText,
            });
            setMessages((prev) => [...prev, data]);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // No user selected
    if (!selectedUser) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] text-center p-8">
                <div className="w-24 h-24 rounded-full bg-[#1f1f1f] flex items-center justify-center mb-6">
                    <MessageCircle className="w-10 h-10 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-200 mb-2">
                    Signal for Web
                </h2>
                <p className="text-gray-500 text-sm max-w-xs">
                    Send and receive messages without keeping your phone online.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#121212]">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-[#272727] flex items-center justify-between bg-[#121212]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-1 -ml-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#1f1f1f] flex items-center justify-center text-white font-bold text-sm">
                            {selectedUser.username?.[0]?.toUpperCase()}
                        </div>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#4ade80] border-2 border-[#121212]" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-100 text-sm">
                            {selectedUser.username}
                        </h3>
                        {isOnline && (
                            <p className="text-xs text-gray-500">
                                Online
                            </p>
                        )}
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-4 text-gray-400">
                    <Search className="w-5 h-5 hover:text-gray-200 cursor-pointer transition-colors" />
                    <MoreVertical className="w-5 h-5 hover:text-gray-200 cursor-pointer transition-colors" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-[#2c6bed] animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm opacity-50">
                        <p>No messages yet</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.senderId === authUser._id;
                        const showTimestamp =
                            index === 0 ||
                            new Date(msg.createdAt).toDateString() !==
                            new Date(messages[index - 1].createdAt).toDateString();

                        return (
                            <div key={msg._id || index}>
                                {showTimestamp && (
                                    <div className="flex items-center justify-center my-6">
                                        <span className="text-xs text-gray-500 font-medium">
                                            {new Date(msg.createdAt).toLocaleDateString([], {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 message-bubble group`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 text-sm leading-relaxed relative ${isMine
                                            ? "bg-[#2c6bed] text-white rounded-2xl rounded-tr-sm"
                                            : "bg-[#333333] text-gray-100 rounded-2xl rounded-tl-sm"
                                            }`}
                                    >
                                        <p className="break-words whitespace-pre-wrap">
                                            {msg.message}
                                        </p>
                                        <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? "text-white/60" : "text-gray-400"}`}>
                                            <span className="text-[10px]">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            {isMine && <span className="text-[10px]">✓</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput onSend={handleSend} />
        </div>
    );
};

export default ChatWindow;
