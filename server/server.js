const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // Added for static file serving
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");

// Load env vars
dotenv.config({ path: path.join(__dirname, ".env") });

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(
    cors({
        origin: ["http://localhost:5173", "https://nirapulse.onrender.com"],
        credentials: true,
    })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/friends", require("./routes/friendRoutes"));

app.get("/api/health", (req, res) => {
    res.json({ status: "NiraPulse server is running" });
});

// --------------------------
// Deployment Configuration
// --------------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
    // Serve static files from the client/dist folder
    app.use(express.static(path.join(__dirname1, "../client/dist")));

    // Handle React routing, return all requests to index.html
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname1, "../client/dist", "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("API is running successfully");
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
