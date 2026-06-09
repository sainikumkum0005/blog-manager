const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Blog = require("./models/Blog");
const User = require("./models/user"); // Changed to match your exact file casegit rm -r --cached server/models/

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "super_secret_neon_key_123"; 

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// Authentication Middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

// --- AUTH ROUTE: SIGNUP ---
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: "Username already taken!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTH ROUTE: LOGIN ---
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User does not exist!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials!" });

    // Verify Streak status on Login
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (user.lastWriteDate !== "" && user.lastWriteDate !== todayStr && user.lastWriteDate !== yesterdayStr) {
      user.streak = 0;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, username: user.username, streak: user.streak });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET LIVE USER STATS ---
app.get("/user-stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const totalBlogs = await Blog.countDocuments({ author: req.user.id });
    res.json({ streak: user.streak, totalBlogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CREATE BLOG (Auth Protected + Streak Handler) ---
app.post("/blogs", auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newBlog = new Blog({ title, content, author: req.user.id });
    await newBlog.save();

    // Handle Streak
    const user = await User.findById(req.user.id);
    const todayStr = new Date().toDateString();
    if (user.lastWriteDate !== todayStr) {
      user.streak += 1;
      user.lastWriteDate = todayStr;
      await user.save();
    }

    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET ONLY USER'S OWN BLOGS ---
app.get("/blogs", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DELETE BLOG ---
app.delete("/blogs/:id", auth, async (req, res) => {
  try {
    await Blog.findOneAndDelete({ _id: req.params.id, author: req.user.id });
    res.json({ message: "Blog Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));  
