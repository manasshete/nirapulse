import { Phone, PhoneOff, Video } from "lucide-react";

const IncomingCall = ({ callerName, callType = "video", onAccept, onReject }) => {
    const isVideoCall = callType === "video";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e1e2e] border border-white/10 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
                {/* Animated ring */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-violet-600/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-violet-600/30 animate-ping" style={{ animationDelay: "0.3s" }} />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                        {isVideoCall ? (
                            <Video className="w-10 h-10 text-white" />
                        ) : (
                            <Phone className="w-10 h-10 text-white" />
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">
                    {isVideoCall ? "Incoming Video Call" : "Incoming Voice Call"}
                </h3>
                <p className="text-gray-400 mb-8">{callerName} is calling you...</p>

                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={onReject}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all"
                    >
                        <PhoneOff className="w-7 h-7" />
                    </button>
                    <button
                        onClick={onAccept}
                        className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-600/30 transition-all"
                    >
                        <Phone className="w-7 h-7" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCall;
