import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { authUser } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (authUser) {
            const newSocket = io("http://localhost:5000", {
                query: { userId: authUser._id },
            });

            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Friend request notifications
            newSocket.on("friendRequestReceived", () => {
                window.dispatchEvent(new CustomEvent("friendRequestReceived"));
            });

            newSocket.on("friendRequestAccepted", () => {
                window.dispatchEvent(new CustomEvent("friendRequestAccepted"));
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
                setSocket(null);
            };
        } else {
            setSocket((prev) => {
                if (prev) prev.close();
                return null;
            });
            setOnlineUsers([]);
        }
    }, [authUser]);

    return (
        <SocketContext.Provider
            value={{
                socket,
                onlineUsers,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};
