import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

const VideoCall = ({
    callUser,
    isInitiator,
    callType = "video",
    incomingSignalData,
    onEnd,
}) => {
    const {
        socket,
        callAccepted,
        callEnded,
        callRejected,
        resetCallState,
        setIceListener,
    } = useSocket();
    const { authUser } = useAuth();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);

    const isVideoCall = callType === "video";

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callStatus, setCallStatus] = useState(
        isInitiator ? "calling" : "connecting"
    );
    const [callDuration, setCallDuration] = useState(0);

    // Timer
    useEffect(() => {
        let interval;
        if (callStatus === "connected") {
            interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

    const formatTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
    }, []);

    const handleEnd = useCallback(() => {
        cleanup();
        resetCallState();
        onEnd();
    }, [cleanup, resetCallState, onEnd]);

    const endCall = useCallback(() => {
        if (socket) socket.emit("call:end", { to: callUser._id });
        handleEnd();
    }, [socket, callUser, handleEnd]);

    // ─── Initialize WebRTC ───
    useEffect(() => {
        if (!socket) return;

        let pc;

        const init = async () => {
            try {
                // Get media
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideoCall,
                    audio: true,
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                // Create peer connection
                pc = new RTCPeerConnection(ICE_SERVERS);
                pcRef.current = pc;

                // Add tracks
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                // Remote track handler
                pc.ontrack = (e) => {
                    console.log("[WebRTC] Got remote track");
                    if (remoteVideoRef.current && e.streams[0]) {
                        remoteVideoRef.current.srcObject = e.streams[0];
                    }
                    setCallStatus("connected");
                };

                // ICE candidate handler — send to other peer via server
                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        socket.emit("call:ice-candidate", {
                            to: callUser._id,
                            candidate: { candidate: e.candidate.candidate, sdpMid: e.candidate.sdpMid, sdpMLineIndex: e.candidate.sdpMLineIndex },
                        });
                    }
                };

                pc.oniceconnectionstatechange = () => {
                    console.log("[WebRTC] ICE:", pc.iceConnectionState);
                    if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                        setCallStatus("connected");
                    }
                    if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
                        handleEnd();
                    }
                };

                // Register ICE candidate listener with SocketContext
                setIceListener(async (candidate) => {
                    try {
                        if (pcRef.current && candidate) {
                            await pcRef.current.addIceCandidate(candidate);
                        }
                    } catch (err) {
                        console.error("[WebRTC] ICE error:", err);
                    }
                });

                if (isInitiator) {
                    // CALLER: create offer
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit("call:initiate", {
                        to: callUser._id,
                        from: authUser._id,
                        callerName: authUser.username,
                        signalData: { type: offer.type, sdp: offer.sdp },
                        callType,
                    });
                    console.log("[Caller] Offer sent");
                } else if (incomingSignalData) {
                    // RECEIVER: set offer, create answer
                    console.log("[Receiver] Processing offer...");
                    await pc.setRemoteDescription(incomingSignalData);
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit("call:accept", {
                        to: callUser._id,
                        signalData: { type: answer.type, sdp: answer.sdp },
                    });
                    console.log("[Receiver] Answer sent");
                }
            } catch (err) {
                console.error("[WebRTC] Setup error:", err);
                handleEnd();
            }
        };

        init();

        return () => {
            setIceListener(null);
            cleanup();
        };
    }, [socket]);

    // ─── CALLER: React to answer via state ───
    useEffect(() => {
        if (!callAccepted || !isInitiator || !pcRef.current) return;

        const applyAnswer = async () => {
            try {
                const pc = pcRef.current;
                if (pc && pc.signalingState !== "closed" && pc.signalingState !== "stable") {
                    console.log("[Caller] Applying answer...", pc.signalingState);
                    await pc.setRemoteDescription(callAccepted.signalData);
                    setCallStatus("connected");
                    console.log("[Caller] Answer applied! Connected.");
                } else {
                    console.log("[Caller] PC state:", pc?.signalingState, "- skipping answer");
                }
            } catch (err) {
                console.error("[Caller] Error applying answer:", err);
            }
        };

        applyAnswer();
    }, [callAccepted, isInitiator]);

    // ─── React to call ended/rejected ───
    useEffect(() => {
        if (callEnded || callRejected) {
            handleEnd();
        }
    }, [callEnded, callRejected, handleEnd]);

    const toggleMute = () => {
        const s = localStreamRef.current;
        if (s) {
            const tracks = s.getAudioTracks();
            tracks.forEach((t) => {
                t.enabled = isMuted; // if currently muted, enable; if not muted, disable
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        const s = localStreamRef.current;
        if (s) {
            const tracks = s.getVideoTracks();
            tracks.forEach((t) => {
                t.enabled = isCameraOff;
            });
            setIsCameraOff(!isCameraOff);
        }
    };

    const statusText =
        callStatus === "calling"
            ? "Calling..."
            : callStatus === "connecting"
                ? "Connecting..."
                : formatTime(callDuration);

    // ─── Audio Call UI ───
    if (!isVideoCall) {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] flex flex-col items-center justify-center">
                <div className="relative mb-6">
                    {callStatus !== "connected" && (
                        <>
                            <div className="absolute inset-[-16px] rounded-full bg-violet-600/15 animate-ping" />
                            <div
                                className="absolute inset-[-8px] rounded-full bg-violet-600/20 animate-ping"
                                style={{ animationDelay: "0.3s" }}
                            />
                        </>
                    )}
                    <img
                        src={callUser.profilePic || `https://api.dicebear.com/9.x/initials/svg?seed=${callUser.username}`}
                        alt={callUser.username}
                        className="w-32 h-32 rounded-full border-4 border-violet-500/30 relative z-10"
                    />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{callUser.username}</h2>
                <p className="text-gray-400 text-sm mb-8">Voice Call • {statusText}</p>
                <div className="flex items-center gap-5">
                    <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-white border border-white/10 hover:bg-white/20"}`}>
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all">
                        <PhoneOff className="w-7 h-7" />
                    </button>
                </div>
            </div>
        );
    }

    // ─── Video Call UI ───
    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a14] flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
                <h3 className="text-white font-semibold text-lg">{callUser.username}</h3>
                <p className="text-gray-400 text-sm">Video Call • {statusText}</p>
            </div>

            <div className="flex-1 relative">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

                {callStatus !== "connected" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a14]">
                        <div className="text-center">
                            <img src={callUser.profilePic || `https://api.dicebear.com/9.x/initials/svg?seed=${callUser.username}`} alt={callUser.username} className="w-28 h-28 rounded-full border-4 border-violet-500/30 mx-auto mb-4" />
                            <p className="text-white text-xl font-semibold mb-2">{callUser.username}</p>
                            <div className="flex items-center gap-2 justify-center text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                                <span className="ml-2">{statusText}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-24 right-4 w-40 h-56 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-[#1e1e2e]">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-5">
                    <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-white border border-white/10 hover:bg-white/20"}`}>
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all">
                        <PhoneOff className="w-7 h-7" />
                    </button>
                    <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCameraOff ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/10 text-white border border-white/10 hover:bg-white/20"}`}>
                        {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
