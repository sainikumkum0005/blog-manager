import { useState, useEffect } from "react";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import "./App.css";

const API_URL = "https://blog-manager-u4hj.onrender.com";

const firebaseConfig = {
  apiKey: "AIzaSyBbxiOvXAwzUJnGmFumWAXQ7bIAhHMdDm4",
  authDomain: "blog-manager-0005.firebaseapp.com",
  projectId: "blog-manager-0005",
  storageBucket: "blog-manager-0005.firebasestorage.app",
  messagingSenderId: "112599006005",
  appId: "1:112599006005:web:c88bd2e7ebafbd387fea7c",
  measurementId: "G-N58W92DZ21"
};

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ streak: 0, totalBlogs: 0 });

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const token = await firebaseUser.getIdToken();
        localStorage.setItem("authToken", token);
        fetchUserData(token);
      } else {
        setUser(null);
        localStorage.removeItem("authToken");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (token) => {
    const activeToken = token || localStorage.getItem("authToken");
    if (!activeToken) return;
    try {
      const headers = { Authorization: activeToken };
      const resBlogs = await axios.get(`${API_URL}/blogs`, { headers });
      const resStats = await axios.get(`${API_URL}/user-stats`, { headers });
      setBlogs(resBlogs.data);
      setStats(resStats.data);
    } catch (error) {
      console.error("Fetch Data Error: ", error);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem("authToken", token);

      await axios.post(`${API_URL}/sync-user`, {}, {
        headers: { Authorization: token }
      });

      setUser(result.user);
      fetchUserData(token);
    } catch (error) {
      alert("Google Verification Failure: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(firebaseAuth);
    setBlogs([]);
    setStats({ streak: 0, totalBlogs: 0 });
    localStorage.removeItem("authToken");
  };

  const publishBlog = async () => {
    if (!title || !content) return alert("Please fill title and content parameters!");
    const token = localStorage.getItem("authToken");
    try {
      await axios.post(`${API_URL}/blogs`, { title, content }, {
        headers: { Authorization: token }
      });
      setTitle("");
      setContent("");
      fetchUserData(token);
      alert("Blog indexed successfully in Database Logs!");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBlog = async (id) => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`${API_URL}/blogs/${id}`, {
        headers: { Authorization: token }
      });
      fetchUserData(token);
    } catch (error) {
      console.error(error);
    }
  };

  // Filter functionality for real-time search bar lookup
  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* --- RENDERING: LOGIN COMPONENT SCREEN --- */
  if (!user) {
    return (
      <div className="login-screen-container">
        <div className="login-left-hero">
          <div className="brand-header-logo">
            <span>✒️</span> BLOG MANAGER
          </div>
          <h1 className="hero-main-title">
            <span>Write.</span>
            <span>Track.</span>
            <span className="gradient-text">Improve.</span>
          </h1>
          <p className="hero-tagline">
            Your personal blogging workspace to create content, track your streaks, level up and grow every day.
          </p>
          <div className="inline-features-row">
            <div className="feature-pill-node">
              <span className="f-icon">📝</span>
              <span className="f-title">Create Blogs</span>
              <span className="f-desc">Write and publish thoughts</span>
            </div>
            <div className="feature-pill-node">
              <span className="f-icon">🔥</span>
              <span className="f-title">Daily Streaks</span>
              <span className="f-desc">Stay consistent built habits</span>
            </div>
            <div className="feature-pill-node">
              <span className="f-icon">🏆</span>
              <span className="f-title">Level Up</span>
              <span className="f-desc">Unlock legendary ranks</span>
            </div>
            <div className="feature-pill-node">
              <span className="f-icon">⏱️</span>
              <span className="f-title">Reading Time</span>
              <span className="f-desc">Know your metric scale</span>
            </div>
          </div>
          <div className="quote-box-node">
            <p>"Consistency today, mastery tomorrow. Keep writing, keep leveling up."</p>
            <span>— Workspace System Engine</span>
          </div>
        </div>

        <div className="login-right-panel">
          <div className="login-glass-card">
            <div className="login-card-logo-circle">✒️</div>
            <h2>Welcome Back!</h2>
            <p>Sign in to continue to your workspace</p>
            <button className="google-continue-btn" onClick={handleGoogleSignIn} disabled={loading}>
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/copy_of_googleg_24dp.png" alt="G" width="18" />
              {loading ? "Authenticating Account..." : "Continue with Google"}
            </button>
            <div className="secure-shield-text">🔒 Secure, simple and private. We respect your data.</div>
            <div className="login-footer-links">
              By continuing, you agree to our <span>Terms of Service</span> 📑 <span>Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --- RENDERING: MANAGEMENT DASHBOARD SHELL --- */
  return (
    <div className="dashboard-grid-layout">
      <aside className="sidebar-deck">
        <div className="sidebar-logo-area">
          <span style={{ color: "#6366f1" }}>✒️</span> BLOG MANAGER
        </div>
        <nav className="sidebar-nav-stack">
          <div className={`sidebar-nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            <span>📋</span> Dashboard
          </div>
          <div className={`sidebar-nav-link ${activeTab === "blogs" ? "active" : ""}`} onClick={() => setActiveTab("blogs")}>
            <span>📚</span> My Blogs
          </div>
          <div className={`sidebar-nav-link ${activeTab === "statistics" ? "active" : ""}`} onClick={() => setActiveTab("statistics")}>
            <span>📊</span> Statistics
          </div>
          <div className="sidebar-nav-link"><span>🏅</span> Achievements</div>
          <div className="sidebar-nav-link"><span>⚙️</span> Settings</div>
        </nav>

        <div className="sidebar-bottom-card">
          <span>✨</span>
          <h4>Stay Consistent!</h4>
          <p>Write everyday to maintain your absolute metric streak.</p>
        </div>
        <button className="sidebar-logout-action" onClick={handleLogout}>Logout 🚪</button>
      </aside>

      <main className="center-workspace">
        <header className="workspace-top-header">
          <div className="header-user-meta">
            <h2>Hello, {user.displayName} 👋</h2>
            <p>Keep writing amazing blogs!</p>
          </div>
          <div className="header-right-badges">
            <div className="header-metric-pill">
              <span className="m-label">Current Streak</span>
              <span className="m-val">🔥 {stats.streak} Days</span>
            </div>
            <div className="header-metric-pill">
              <span className="m-label">Current Level</span>
              <span className="m-val level">👑 Chronicle Knight</span>
            </div>
            <img src={user.photoURL || "https://via.placeholder.com/150"} alt="User" className="user-display-avatar" />
          </div>
        </header>

        {activeTab === "dashboard" && (
          <>
            {/* BOX 1: EDITOR */}
            <div className="premium-content-box">
              <div className="panel-header-row">
                <h3>✒️ Create New Blog</h3>
                <button className="premium-clear-btn" onClick={() => { setTitle(""); setContent(""); }}>Clear</button>
              </div>
              <input type="text" placeholder="Enter an engaging title..." value={title} onChange={(e) => setTitle(e.target.value)} className="premium-title-input" />
              <div className="premium-rich-bar">
                <span>H</span> <span>B</span> <span>I</span> <span>📋</span> <span>🔢</span> <span>”</span> <span>&lt;&gt;</span> <span>🔗</span> <span>🖼️</span>
              </div>
              <textarea placeholder="Start writing your blog here..." value={content} onChange={(e) => setContent(e.target.value)} className="premium-textarea-editor" />
              <button className="premium-publish-btn" onClick={publishBlog}>🚀 Publish Blog</button>
            </div>

            {/* BOX 2: REAL-TIME FEED INTEGRATION */}
            <div className="premium-content-box">
              <div className="panel-header-row">
                <h3>📚 My Blogs <span style={{fontSize:'0.85rem', color:'var(--text-muted)'}}>All your published blogs</span></h3>
                <div className="search-bar-wrapper">
                  <input type="text" placeholder="Search blogs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="logs-stack-container">
                {filteredBlogs.length === 0 ? <div style={{color:'var(--text-muted)', textAlign:'center', padding:'20px'}}>No records found matching criteria.</div> : 
                  filteredBlogs.map((b) => (
                    <div className="premium-log-card" key={b._id}>
                      <div className="log-card-left">
                        <div className="log-icon-square">📄</div>
                        <div className="log-details">
                          <h4>{b.title}</h4>
                          <div className="log-metadata-row">
                            <span>⏱️ {Math.ceil(b.content.split(' ').length / 150) || 1} min read</span>
                            <span>•</span>
                            <span>📅 {new Date(b.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</span>
                            <span>•</span>
                            <span>📝 {b.content.split(' ').length} words</span>
                          </div>
                        </div>
                      </div>
                      <div className="log-card-right-actions">
                        <button className="log-action-btn">View</button>
                        <button className="log-action-btn">Edit</button>
                        <button className="log-action-btn delete-btn" onClick={() => deleteBlog(b._id)}>Delete</button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "blogs" && (
          <div className="premium-content-box">
            <h3>📚 Indexed Vault Feed ({blogs.length} Stories Total)</h3>
            <p style={{color:'var(--text-muted)'}}>All database structural logs are active on production clusters.</p>
          </div>
        )}

        {activeTab === "statistics" && (
          <div className="premium-content-box">
            <h3>📊 Live Metrics Track</h3>
            <p>Total Database Logs Created: <strong>{stats.totalBlogs} Entries</strong></p>
            <p>Calculated Continuous Growth Streak: <strong>{stats.streak} Day Cycles</strong></p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 