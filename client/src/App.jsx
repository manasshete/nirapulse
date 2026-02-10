import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

const ProtectedRoute = ({ children }) => {
    const { authUser, loading } = useAuth();
    if (loading) return null;
    return authUser ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { authUser, loading } = useAuth();
    if (loading) return null;
    return authUser ? <Navigate to="/chat" /> : children;
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <Routes>
                        <Route path="/" element={<Navigate to="/chat" />} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/chat"
                            element={
                                <ProtectedRoute>
                                    <Chat />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            style: {
                                background: "#1e1e2e",
                                color: "#cdd6f4",
                                border: "1px solid rgba(255,255,255,0.05)",
                            },
                        }}
                    />
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
