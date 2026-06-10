import { useState, useEffect } from "react";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import "./App.css";

const API_URL = "https://blog-manager-u4hj.onrender.com";

// --- 🔥 FREEBASE CONFIGURATION ---
// Ise tum bad me apne firebase console se real keys ke sath replace kar sakte ho
const firebaseConfig = {
  apiKey: "AIzaSyAsFakeKey_Example123456789",
  authDomain: "blog-manager-auth.firebaseapp.com",
  projectId: "blog-manager-auth",
  storageBucket: "blog-manager-auth.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({ streak: 0, totalBlogs: 0 });

  useEffect(() => {
    // Firebase auth state persistence listener
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const jwtToken = await firebaseUser.getIdToken();
        localStorage.setItem("token", jwtToken);
        setToken(jwtToken);
        setUser(firebaseUser);
        fetchUserData(jwtToken);
      } else {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (activeToken) => {
    if (!activeToken) return;
    try {
      const headers = { Authorization: activeToken };
      const resBlogs = await axios.get(`${API_URL}/blogs`, { headers });
      const resStats = await axios.get(`${API_URL}/user-stats`, { headers });
      setBlogs(resBlogs.data);
      setStats(resStats.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const jwtToken = await result.user.getIdToken();
      
      // Backend ko user verify/create karne ke liye hit karenge
      await axios.post(`${API_URL}/sync-user`, {}, {
        headers: { Authorization: jwtToken }
      });

      localStorage.setItem("token", jwtToken);
      setToken(jwtToken);
      setUser(result.user);
      fetchUserData(jwtToken);
    } catch (error) {
      alert("Google Sign-In Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(firebaseAuth);
    localStorage.clear();
    setBlogs([]);
    setStats({ streak: 0, totalBlogs: 0 });
  };

  const getGamifiedBadge = () => {
    const level = Math.floor(stats.streak / 15) + 1;
    const badges = ["Novice Scribe 🐣", "Code Wordsmith ✍️", "Neon Blogger 🚀", "Streak Legend 👑", "Immortal Scribe 🌌"];
    return { level, badgeTitle: badges[level - 1] || "God Mode 🪐" };
  };

  const publishBlog = async () => {
    if (!title || !content) {
      alert("Creation fields cannot be empty!");
      return;
    }
    try {
      await axios.post(`${API_URL}/blogs`, { title, content }, {
        headers: { Authorization: token }
      });
      setTitle("");
      setContent("");
      fetchUserData(token);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBlog = async (id) => {
    try {
      await axios.delete(`${API_URL}/blogs/${id}`, {
        headers: { Authorization: token }
      });
      fetchUserData(token);
    } catch (error) {
      console.error(error);
    }
  };

  // --- SCENE 1: ADVANCED GOOGLE AUTHENTICATION SYSTEM ---
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card premium-auth animate-glow">
          <div className="brand-logo">✨</div>
          <h1>Creative Hub</h1>
          <p>Secure identity access gateway via Google Authentication factor</p>
          
          <button className="google-auth-btn" onClick={handleGoogleSignIn} disabled={loading}>
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/copy_of_googleg_24dp.png" alt="G" />
            {loading ? "Authenticating Gateway..." : "Continue with Google"}
          </button>
          
          <div className="security-footer">🛡️ Verified Secure Zero-Bot Shield</div>
        </div>
      </div>
    );
  }

  // --- SCENE 2: PROFESSIONAL 3-COLUMN WORKSPACE DASHBOARD ---
  return (
    <div className="dashboard-grid-layout">
      
      {/* 🧭 BAR 1: LEFT SIDEBAR - PROFILE & DYNAMIC GAMIFICATION SYSTEM */}
      <aside className="sidebar-deck glass-card">
        <div className="profile-wrapper">
          <img src={user?.photoURL || "https://via.placeholder.com/150"} alt="Avatar" className="user-avatar" />
          <h3>{user?.displayName || "Creative Author"}</h3>
          <span className="user-email">{user?.email}</span>
        </div>

        <hr className="divider-line" />

        <div className="gamified-metrics">
          <div className="metric-box streak-active">
            <span className="icon">🔥</span>
            <div className="metric-info">
              <span className="label">Current Streak</span>
              <span className="val">{stats.streak} Days</span>
            </div>
          </div>

          <div className="metric-box level-active">
            <span className="icon">🏅</span>
            <div className="metric-info">
              <span className="label">Author Level</span>
              <span className="val">Lvl {getGamifiedBadge().level}</span>
            </div>
          </div>
          <div className="badge-ribbon">{getGamifiedBadge().badgeTitle}</div>
        </div>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          Terminate Session 🚪
        </button>
      </aside>

      {/* ✍️ BAR 2: CENTER DECK - MAIN TASK OF CREATING AN ACCOUNT / WRITING SPACE */}
      <main className="center-workspace glass-card">
        <div className="workspace-header">
          <h2>Create New Production</h2>
          <p>Draft your core thoughts directly into the decentralized server pipeline</p>
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Document Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="premium-input"
          />
          <textarea
            placeholder="Begin writing your master story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="premium-textarea"
          />
          <button className="publish-action-btn" onClick={publishBlog}>
            Commit & Publish Story 🚀
          </button>
        </div>
      </main>

      {/* 📖 BAR 3: RIGHT PANEL - PERSONAL PUBLISHED FEED */}
      <section className="right-feed-panel glass-card">
        <div className="feed-header">
          <h2>Live Feed Logs ({stats.totalBlogs})</h2>
          <p>Your managed publications</p>
        </div>

        <div className="scrollable-feed-area">
          {blogs.length === 0 ? (
            <div className="empty-state">No records found. Write down something above to populate logs! 🌌</div>
          ) : (
            blogs.map((blog) => (
              <div className="feed-story-card" key={blog._id}>
                <h4>{blog.title}</h4>
                <p>{blog.content}</p>
                <button className="card-trash-btn" onClick={() => deleteBlog(blog._id)}>
                  Remove Doc 🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}

export default App; 