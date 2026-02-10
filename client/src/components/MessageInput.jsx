import { useState } from "react";
import { Send, Plus, Sticker, Mic } from "lucide-react";

const MessageInput = ({ onSend }) => {
    const [message, setMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSend(message.trim());
        setMessage("");
    };

    return (
        <div className="p-4 bg-[#121212]">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                    <Plus className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Message"
                        maxLength={2000}
                        className="w-full py-2.5 px-5 bg-[#2E3032] rounded-full text-white placeholder-gray-500 focus:outline-none focus:bg-[#3E4042] transition-colors border-none"
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <Sticker className="w-5 h-5" />
                    </button>
                </div>
                {message.trim() ? (
                    <button
                        type="submit"
                        className="p-3 bg-[#2c6bed] hover:bg-[#3b82f6] text-white rounded-full transition-all duration-200 shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        className="p-3 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <Mic className="w-6 h-6" />
                    </button>
                )}
            </form>
        </div>
    );
};

export default MessageInput;
