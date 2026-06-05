import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://blog-manager-u4hj.onrender.com/blogs";

function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get(API_URL);
      setBlogs(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const createBlog = async () => {
    if (!title || !content) {
      alert("Please fill all fields");
      return;
    }

    try {
      await axios.post(API_URL, {
        title,
        content,
      });

      setTitle("");
      setContent("");

      fetchBlogs();
    } catch (error) {
      console.log(error);
    }
  };

  const editBlog = (blog) => {
    setTitle(blog.title);
    setContent(blog.content);
    setEditingId(blog._id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const updateBlog = async () => {
    try {
      await axios.put(`${API_URL}/${editingId}`, {
        title,
        content,
      });

      setTitle("");
      setContent("");
      setEditingId(null);

      fetchBlogs();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteBlog = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchBlogs();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">
      <div className="glass-card">
        <h1>✨ Blog Manager</h1>
        <p>Create, Edit & Publish Your Stories</p>

        <input
          type="text"
          placeholder="Enter Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Write your blog content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button onClick={editingId ? updateBlog : createBlog}>
          {editingId ? "Update Blog ✏️" : "Create Blog 🚀"}
        </button>
      </div>

      <div className="blogs-section">
        <h2>📖 My Blogs</h2>

        {blogs.length === 0 ? (
          <p>No blogs yet. Create your first blog 🚀</p>
        ) : (
          blogs.map((blog) => (
            <div className="blog-card" key={blog._id}>
              <h3>{blog.title}</h3>
              <p>{blog.content}</p>

              <button onClick={() => editBlog(blog)}>
                Edit ✏️
              </button>

              <button
                className="delete-btn"
                onClick={() => deleteBlog(blog._id)}
              >
                Delete 🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;