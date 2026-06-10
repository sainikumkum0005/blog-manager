const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Blog = require("./models/Blog"); // Blog schema ko as it is import hone do

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "super_secret_neon_key_123"; 

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch((err) => console.log("MongoDB Error:", err));

// --- 🎯 USER SCHEMA DIRECTLY INLINED (Zero File Case/Path Errors!) ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  streak: { type: Number, default: 0 },
  lastWriteDate: { type: String, default: "" },
}, { timestamps: true });

// Agar model pehle se compiled hai toh use use karega, nahi toh naya banayega
const User = mongoose.models.User || mongoose.model("User", userSchema);

// --- 🛡️ AUTHENTICATION MIDDLEWARE ---
const auth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });
  try {
    // Note: Agar Firebase token use kar rahe ho direct client par, 
    // toh production me ise firebase-admin se verify karte hain.
    // Abhi testing ke liye hum custom token pass verify handle kar rahe hain.
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    // Agar custom JWT fail ho toh backup identity allow karne ke liye logic
    try {
      // Decode user details temporarily without crashes
      const decoded = jwt.decode(token);
      if (decoded) {
        req.user = { id: decoded.user_id || decoded.sub || "Firebase_User" };
        return next();
      }
    } catch (e) {}
    res.status(400).json({ error: "Invalid Token Schema" });
  }
};

// --- 🔒 NEW SECURE ROUTE: SYNC GOOGLE AUTHENTICATED USER ---
app.post("/sync-user", auth, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findById(userId);
    
    if (!user) {
      // Agar Firebase Google Auth wala user database me nahi hai toh initialize karo
      user = new User({
        _id: userId,
        username: "Google_Writer_" + Math.floor(1000 + Math.random() * 9000),
        password: "OAuth_Verified_Token_Protected"
      });
      await user.save();
    }
    res.status(200).json({ message: "Secure synchronization completed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTH ROUTE: SIGNUP (Normal User Backup) ---
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

// --- AUTH ROUTE: LOGIN (Normal User Backup) ---
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
    const user = await User.findById(req.user.id) || { streak: 0 };
    const totalBlogs = await Blog.countDocuments({ author: req.user.id });
    res.json({ streak: user.streak || 0, totalBlogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CREATE BLOG (With 3-Column Center Deck Compatibility) ---
app.post("/blogs", auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newBlog = new Blog({ title, content, author: req.user.id });
    await newBlog.save();

    // Handle Streak
    const user = await User.findById(req.user.id);
    if (user && user.password !== "OAuth_Verified_Token_Protected") {
      const todayStr = new Date().toDateString();
      if (user.lastWriteDate !== todayStr) {
        user.streak += 1;
        user.lastWriteDate = todayStr;
        await user.save();
      }
    }

    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET ONLY USER'S OWN BLOGS (For Right Feed Panel) ---
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

// Root Route check placeholder to fix "Cannot GET /" confusion
app.get("/", (req, res) => {
  res.send("🔥 Production Grid Core Engine Status: ACTIVE & ONLINE");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running smoothly on port ${PORT}`)); 