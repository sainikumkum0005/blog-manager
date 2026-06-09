import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "https://blog-manager-u4hj.onrender.com";

function App() {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token"),
    user: localStorage.getItem("user")
  });
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({ streak: 0, totalBlogs: 0 });

  const headers = { Authorization: auth.token };

  const fetchUserData = async () => {
    if (!auth.token) return;
    try {
      const resBlogs = await axios.get(`${API_URL}/blogs`, { headers });
      const resStats = await axios.get(`${API_URL}/user-stats`, { headers });
      setBlogs(resBlogs.data);
      setStats(resStats.data);
    } catch (error) {
      console.log("Session expired or server error", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [auth]);

  const handleAuthSubmit = async () => {
    if (!authForm.username || !authForm.password) {
      alert("Please fill all authentication fields!");
      return;
    }
    const endpoint = isLogin ? "login" : "signup";
    try {
      const res = await axios.post(`${API_URL}/${endpoint}`, authForm);
      if (isLogin) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", res.data.username);
        setAuth({ token: res.data.token, user: res.data.username });
      } else {
        alert("Account Created successfully ✨ Now please Login!");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Auth process failed!");
    }
  };

  const getGamifiedBadge = () => {
    // Level changes on multiples of 15 days of streak
    const level = Math.floor(stats.streak / 15) + 1;
    const badges = ["Novice Writer 🐣", "Scribe Apprentice ✍️", "Wordsmith Elite 🚀", "Blog Legend 👑", "Immortal Author 🌌"];
    return { level, badgeTitle: badges[level - 1] || "God Mode 🪐" };
  };

  const calculateReadingTime = (text) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  const createBlog = async () => {
    if (!title || !content) {
      alert("Please fill all fields");
      return;
    }
    try {
      await axios.post(`${API_URL}/blogs`, { title, content }, { headers });
      setTitle("");
      setContent("");
      fetchUserData();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteBlog = async (id) => {
    try {
      await axios.delete(`${API_URL}/blogs/${id}`, { headers });
      fetchUserData();
    } catch (error) {
      console.log(error);
    }
  };

  // --- RENDERING SCENE 1: AUTHENTICATION INTERFACE (Deadly Neon-Aesthetics) ---
  if (!auth.token) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="glass-card auth-card animate-glow">
          <h1>✨ {isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p style={{ marginTop: "-10px", marginBottom: "20px" }}>Access your private creative panel</p>
          
          <input
            type="text"
            placeholder="Enter Username"
            onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Enter Password"
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
          />
          
          <button onClick={handleAuthSubmit} style={{ marginTop: "25px" }}>
            {isLogin ? "Secure Login 🚀" : "Register Credentials ✨"}
          </button>
          
          <p className="toggle-auth-mode" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "New writer around here? Sign Up" : "Already have credentials? Login"}
          </p>
        </div>
      </div>
    );
  }

  // --- RENDERING SCENE 2: INTERACTIVE DASHBOARD HUB ---
  return (
    <div className="container">
      {/* Dynamic Profile & Gamification Stats Panel */}
      <div className="gamified-stats-bar">
        <div className="stat-badge streak-badge">
          🔥 <span className="stat-label">Streak:</span> <strong>{stats.streak} Days</strong>
        </div>
        <div className="stat-badge level-badge">
          🏅 <span className="stat-label">Badge:</span> <strong>Lvl {getGamifiedBadge().level} - {getGamifiedBadge().badgeTitle}</strong>
        </div>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.reload(); }}>
          Logout 🚪
        </button>
      </div>

      <div className="glass-card">
        <h1>✨ {auth.user}'s Blog Space</h1>
        <p>Your absolute personal management deck</p>

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

        <button onClick={createBlog}>Publish Story 🚀</button>
      </div>

      <div className="blogs-section">
        <h2>📖 My Personal Feed ({stats.totalBlogs})</h2>

        {blogs.length === 0 ? (
          <p style={{ textAlign: "center", color: "#c9d3e5" }}>No blogs yet. Write down your first content today! 🚀</p>
        ) : (
          <div className="blogs-grid">
            {blogs.map((blog) => (
              <div className="blog-card" key={blog._id}>
                <div className="blog-meta-header">
                  <span className="reading-time-tag">⏱️ {calculateReadingTime(blog.content)} min read</span>
                </div>
                <h3>{blog.title}</h3>
                <p>{blog.content}</p>

                <div className="card-actions">
                  <button className="delete-btn" onClick={() => deleteBlog(blog._id)}>
                    Delete 🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 