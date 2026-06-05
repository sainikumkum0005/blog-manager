const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Blog = require("./models/Blog");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });

// Home Route
app.get("/", (req, res) => {
  res.send("Blog Manager Backend Running...");
});

// Create Blog
app.post("/blogs", async (req, res) => {
  try {
    const { title, content } = req.body;

    const newBlog = new Blog({
      title,
      content,
    });

    await newBlog.save();

    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Get All Blogs
app.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Update Blog
app.put("/blogs/:id", async (req, res) => {
  try {
    const { title, content } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
      },
      { new: true }
    );

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Delete Blog
app.delete("/blogs/:id", async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);

    res.json({
      message: "Blog Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});