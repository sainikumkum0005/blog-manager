const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Blog = require("./models/Blog");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected 🚀"))
  .catch((err) => console.log("MongoDB Error:", err));

/* ---------------- AUTH MIDDLEWARE ---------------- */

const auth = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({
      error: "No token provided"
    });
  }

  try {
    const decoded = jwt.decode(token);

    if (!decoded) {
      return res.status(401).json({
        error: "Invalid token"
      });
    }

    req.user = {
      id: decoded.user_id || decoded.sub
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Authentication failed"
    });
  }
};

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.send("🚀 Blog Manager API Running");
});

/* ---------------- GOOGLE SYNC ---------------- */

app.post("/sync-user", auth, async (req, res) => {
  try {
    res.status(200).json({
      message: "User authenticated"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/* ---------------- USER STATS ---------------- */

app.get("/user-stats", auth, async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments({
      author: String(req.user.id)
    });

    const streak = totalBlogs;

    res.json({
      streak,
      totalBlogs
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/* ---------------- CREATE BLOG ---------------- */

app.post("/blogs", auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "Title and content required"
      });
    }

    const blog = await Blog.create({
      title,
      content,
      author: String(req.user.id)
    });

    res.status(201).json(blog);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});

/* ---------------- GET BLOGS ---------------- */

app.get("/blogs", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: String(req.user.id)
    }).sort({
      createdAt: -1
    });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/* ---------------- DELETE BLOG ---------------- */

app.delete("/blogs/:id", auth, async (req, res) => {
  try {
    await Blog.findOneAndDelete({
      _id: req.params.id,
      author: String(req.user.id)
    });

    res.json({
      message: "Blog deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 