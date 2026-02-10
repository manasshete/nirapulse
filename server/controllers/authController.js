const User = require("../models/User");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        let { username, email, password } = req.body;

        // Sanitize inputs
        username = username?.trim();
        email = email?.trim().toLowerCase();

        // Validate
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (!validator.isLength(password, { min: 6 })) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }

        if (!validator.isLength(username, { min: 3, max: 30 })) {
            return res
                .status(400)
                .json({ message: "Username must be 3-30 characters" });
        }

        // Sanitize against XSS
        username = validator.escape(username);

        // Check existing user
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this email or username already exists" });
        }

        // Generate avatar
        const profilePic = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}`;

        const user = await User.create({
            username,
            email,
            password,
            profilePic,
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email?.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { register, login };
