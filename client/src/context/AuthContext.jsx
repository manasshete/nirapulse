import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem("nirapulse-user"));
        if (user) setAuthUser(user);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            sessionStorage.setItem("nirapulse-user", JSON.stringify(data));
            setAuthUser(data);
            toast.success("Logged in successfully!");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            const { data } = await api.post("/auth/register", {
                username,
                email,
                password,
            });
            sessionStorage.setItem("nirapulse-user", JSON.stringify(data));
            setAuthUser(data);
            toast.success("Account created successfully!");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
            return false;
        }
    };

    const logout = () => {
        sessionStorage.removeItem("nirapulse-user");
        setAuthUser(null);
        toast.success("Logged out");
    };

    return (
        <AuthContext.Provider value={{ authUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
