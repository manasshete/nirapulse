import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../utils/axios";
import {
    Search,
    LogOut,
    MessageCircle,
    Users,
    UserPlus,
    Bell,
    Check,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

const Sidebar = ({ selectedUser, onSelectUser }) => {
    const [friends, setFriends] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("friends");
    const { authUser, logout } = useAuth();
    const { onlineUsers } = useSocket();

    const fetchFriends = useCallback(async () => {
        try {
            const { data } = await api.get("/friends");
            setFriends(data);
        } catch (error) {
            console.error("Failed to fetch friends:", error);
        }
    }, []);

    const fetchAllUsers = useCallback(async () => {
        try {
            const { data } = await api.get("/users");
            setAllUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }, []);

    const fetchRequests = useCallback(async () => {
        try {
            const [incoming, sent] = await Promise.all([
                api.get("/friends/requests"),
                api.get("/friends/requests/sent"),
            ]);
            setRequests(incoming.data);
            setSentRequests(sent.data);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        }
    }, []);

    useEffect(() => {
        fetchFriends();
        fetchAllUsers();
        fetchRequests();
    }, [fetchFriends, fetchAllUsers, fetchRequests]);

    // Listen for real-time friend events
    useEffect(() => {
        const handleReceived = () => {
            fetchRequests();
            toast("New friend request!", { icon: "👋" });
        };
        const handleAccepted = () => {
            fetchFriends();
            fetchRequests();
            toast.success("Friend request accepted!");
        };

        window.addEventListener("friendRequestReceived", handleReceived);
        window.addEventListener("friendRequestAccepted", handleAccepted);
        return () => {
            window.removeEventListener("friendRequestReceived", handleReceived);
            window.removeEventListener("friendRequestAccepted", handleAccepted);
        };
    }, [fetchFriends, fetchRequests]);

    const sendFriendRequest = async (userId) => {
        try {
            await api.post(`/friends/request/${userId}`);
            toast.success("Friend request sent!");
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            await api.put(`/friends/accept/${requestId}`);
            toast.success("Friend request accepted!");
            fetchFriends();
            fetchRequests();
        } catch (error) {
            toast.error("Failed to accept request");
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            await api.put(`/friends/reject/${requestId}`);
            toast.success("Request rejected");
            fetchRequests();
        } catch (error) {
            toast.error("Failed to reject request");
        }
    };

    // Helpers
    const isFriend = (userId) => friends.some((f) => f._id === userId);
    const hasSentRequest = (userId) =>
        sentRequests.some((r) => r.receiverId?._id === userId);

    const tabs = [
        { id: "friends", label: "Friends", icon: MessageCircle },
        { id: "users", label: "Explore", icon: Users },
        {
            id: "requests",
            label: "Requests",
            icon: Bell,
            badge: requests.length,
        },
    ];

    const renderUserItem = (user, actions) => {
        const isOnline = onlineUsers.includes(user._id);
        const isSelected = selectedUser?._id === user._id;

        return (
            <div
                key={user._id}
                className={`group flex items-center gap-3 p-2 rounded-lg mb-0.5 transition-colors cursor-pointer ${isSelected
                    ? "bg-white/5"
                    : "hover:bg-white/[0.02]"
                    }`}
            >
                <button
                    onClick={() => onSelectUser(user)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                    <div className="relative flex-shrink-0">
                        <img
                            src={
                                user.profilePic ||
                                `https://api.dicebear.com/9.x/initials/svg?seed=${user.username}`
                            }
                            alt={user.username}
                            className="w-10 h-10 rounded-full bg-[#181825]"
                        />
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0f0f1a]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-gray-300 group-hover:text-white"}`}>
                            {user.username}
                        </p>
                        <p
                            className={`text-xs truncate ${isOnline ? "text-green-500/70" : "text-gray-600"}`}
                        >
                            {isOnline ? "Online" : "Offline"}
                        </p>
                    </div>
                </button>
                {actions}
            </div>
        );
    };

    const filteredFriends = friends.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
    );
    const filteredUsers = allUsers.filter(
        (u) =>
            u.username.toLowerCase().includes(search.toLowerCase()) &&
            !isFriend(u._id)
    );

    return (
        <div className="w-[30%] min-w-[320px] max-w-[400px] bg-[#1f1f1f] border-r border-[#272727] flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3E4042] flex items-center justify-center text-white font-bold text-sm">
                        {authUser?.username?.[0]?.toUpperCase()}
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Chats</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={logout}
                        className="p-2 rounded-full hover:bg-[#3E4042] text-gray-400 hover:text-white transition-all duration-200"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-2">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[#2E3032] rounded-full text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:bg-[#3E4042] transition-colors"
                    />
                </div>
            </div>

            {/* Tabs (Optional - simplified) */}
            <div className="px-4 py-2 flex gap-4 border-b border-[#272727]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-sm font-medium pb-2 transition-colors relative ${activeTab === tab.id
                            ? "text-[#e4e4e7] border-b-2 border-white"
                            : "text-[#8e8e93] hover:text-gray-300"}`}
                    >
                        {tab.label}
                        {tab.badge > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#2c6bed] text-[10px] text-white font-bold align-middle">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>


            {/* Content */}
            <div className="flex-1 overflow-y-auto pt-2">
                {/* Friends Tab */}
                {activeTab === "friends" && (
                    <>
                        {filteredFriends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                                <Users className="w-12 h-12 mb-3" />
                                <p className="text-sm">No chats yet</p>
                            </div>
                        ) : (
                            filteredFriends.map((user) => renderUserItem(user, null))
                        )}
                    </>
                )}

                {/* Explore Tab */}
                {activeTab === "users" && (
                    <>
                        {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                                <UserPlus className="w-12 h-12 mb-3" />
                                <p className="text-sm">No new people found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) =>
                                renderUserItem(
                                    user,
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            sendFriendRequest(user._id);
                                        }}
                                        disabled={hasSentRequest(user._id)}
                                        className={`p-2 rounded-full transition-all ${hasSentRequest(user._id)
                                            ? "text-gray-600 bg-transparent cursor-default"
                                            : "text-[#2c6bed] hover:bg-[#2c6bed]/10"
                                            }`}
                                    >
                                        {hasSentRequest(user._id) ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5 text-inherit" />}
                                    </button>
                                )
                            )
                        )}
                    </>
                )}

                {/* Requests Tab */}
                {activeTab === "requests" && (
                    <>
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                                <Bell className="w-12 h-12 mb-3" />
                                <p className="text-sm">No pending requests</p>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <div
                                    key={req._id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#2E3032] transition-colors cursor-default"
                                >
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#3E4042] text-lg font-medium text-white">
                                        {req.senderId?.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#e4e4e7] truncate">
                                            {req.senderId?.username}
                                        </p>
                                        <p className="text-xs text-[#8e8e93]">
                                            Wants to connect
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acceptRequest(req._id)}
                                            className="p-2 rounded-full bg-[#2E3032] text-white hover:bg-[#3E4042] transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => rejectRequest(req._id)}
                                            className="p-2 rounded-full bg-[#2E3032] text-[#ff453a] hover:bg-[#3E4042] transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
