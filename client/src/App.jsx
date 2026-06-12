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
  
  // Dynamic functional control states
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [selectedViewBlog, setSelectedViewBlog] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);

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
      await axios.post(`${API_URL}/sync-user`, {}, { headers: { Authorization: token } });
      setUser(result.user);
      fetchUserData(token);
    } catch (error) {
      alert("Google Sign-In Error: " + error.message);
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

  // FULL WORKING EXECUTION MODULE FOR PUBLISH AND EDIT SAVES
  const publishOrUpdateBlog = async () => {
    if (!title || !content) return alert("Please fill title and content parameters!");
    const token = localStorage.getItem("authToken");
    try {
      if (editingBlogId) {
        // Post current working memory to cluster
        await axios.post(`${API_URL}/blogs`, { title, content }, { headers: { Authorization: token } });
        // Clean out previous instance record to simulate real time safe edit updates
        await axios.delete(`${API_URL}/blogs/${editingBlogId}`, { headers: { Authorization: token } });
        alert("Changes Saved Successfully!");
        setEditingBlogId(null);
      } else {
        await axios.post(`${API_URL}/blogs`, { title, content }, { headers: { Authorization: token } });
        alert("Blog published successfully!");
      }
      setTitle("");
      setContent("");
      fetchUserData(token);
    } catch (error) {
      console.error("Save Operation Failure: ", error);
    }
  };

  // EDIT TRIGGER INTERACTION
  const startEdit = (blog) => {
    setEditingBlogId(blog._id);
    setTitle(blog.title);
    setContent(blog.content);
    setActiveTab("dashboard"); // Force view to dashboard form container
    window.scrollTo({ top: 0, behavior: "smooth" }); // Smooth glide interaction
  };

  const deleteBlog = async (id) => {
    if(!confirm("Are you sure you want to completely erase this record?")) return;
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`${API_URL}/blogs/${id}`, { headers: { Authorization: token } });
      fetchUserData(token);
    } catch (error) {
      console.error(error);
    }
  };

  // Real-time Text Tools Injections
  const applyFormatting = (syntax) => {
    const textarea = document.getElementById("blog-editor-area");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    if (syntax === "H") replacement = `### ${selectedText || "Heading"}`;
    else if (syntax === "B") replacement = `**${selectedText || "bold text"}**`;
    else if (syntax === "I") replacement = `*${selectedText || "italic text"}*`;
    else if (syntax === "L") replacement = `\n- ${selectedText || "List Item"}`;
    else if (syntax === "C") replacement = `\`${selectedText || "code block"}\``;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="login-screen-container">
        <div className="login-left-hero">
          <div className="brand-header-logo"><span>✒️</span> BLOG MANAGER</div>
          <h1 className="hero-main-title">
            <span>Write.</span><span>Track.</span><span className="gradient-text">Improve.</span>
          </h1>
          <button className="google-continue-btn" onClick={handleGoogleSignIn} disabled={loading}>
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/web-24dp/copy_of_googleg_24dp.png" alt="G" width="18" />
            {loading ? "Authenticating Account..." : "Continue with Google"}
          </button>
        </div>
      </div>
    );
  }

  // Pure synchronized modular block to render exact list logs UI
  const renderBlogsFeedList = () => (
    <div className="logs-stack-container">
      {filteredBlogs.length === 0 ? <div style={{color:'var(--text-muted)', textAlign:'center', padding:'20px'}}>No records indexed inside collection.</div> : 
        filteredBlogs.map((b) => (
          <div className="premium-log-card" key={b._id}>
            <div className="log-card-left">
              <div className="log-icon-square">📄</div>
              <div className="log-details">
                <h4>{b.title}</h4>
                <div className="log-metadata-row">
                  <span>⏱️ {Math.ceil(b.content.split(' ').length / 150) || 1} min read</span>
                  <span>•</span>
                  <span>📅 {new Date(b.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>📝 {b.content.split(' ').length} words</span>
                </div>
              </div>
            </div>
            <div className="log-card-right-actions">
              <button className="log-action-btn" onClick={() => setSelectedViewBlog(b)}>View</button>
              <button className="log-action-btn" onClick={() => startEdit(b)}>Edit</button>
              <button className="log-action-btn delete-btn" onClick={() => deleteBlog(b._id)}>Delete</button>
            </div>
          </div>
      ))}
    </div>
  );

  return (
    <div className="dashboard-grid-layout">
      {/* SIDEBAR NAVIGATION COLUMN */}
      <aside className="sidebar-deck">
        <div className="sidebar-logo-area"><span style={{ color: "#6366f1" }}>✒️</span> BLOG MANAGER</div>
        <nav className="sidebar-nav-stack">
          <div className={`sidebar-nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}><span>📋</span> Dashboard</div>
          <div className={`sidebar-nav-link ${activeTab === "blogs" ? "active" : ""}`} onClick={() => { setActiveTab("blogs"); setSearchQuery(""); }}><span>📚</span> My Blogs</div>
          <div className={`sidebar-nav-link ${activeTab === "statistics" ? "active" : ""}`} onClick={() => setActiveTab("statistics")}><span>📊</span> Statistics</div>
          <div className="sidebar-nav-link" onClick={() => setShowAchievements(true)} style={{cursor:'pointer'}}><span>🏅</span> Achievements</div>
        </nav>
        <button className="sidebar-logout-action" onClick={handleLogout}>Logout 🚪</button>
      </aside>

      {/* CENTER WORKSPACE SECTION MATRIX */}
      <main className="center-workspace">
        <header className="workspace-top-header">
          <div className="header-user-meta">
            <h2>Hello, {user.displayName} 👋</h2>
            <p>Keep writing amazing blogs!</p>
          </div>
          <div className="header-right-badges">
            <div className="header-metric-pill"><span className="m-label">Current Streak</span><span className="m-val">🔥 {stats.streak} Days</span></div>
            <div className="header-metric-pill"><span className="m-label">Current Level</span><span className="m-val level">👑 Chronicle Knight</span></div>
            <img src={user.photoURL || "https://via.placeholder.com/150"} alt="User" className="user-display-avatar" />
          </div>
        </header>

        {/* TAB 1: WORKSPACE DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div className="premium-content-box">
              <div className="panel-header-row">
                <h3>{editingBlogId ? "📝 Edit Target Mode" : "✒️ Create New Blog"}</h3>
                <button className="premium-clear-btn" onClick={() => { setTitle(""); setContent(""); setEditingBlogId(null); }}>Clear</button>
              </div>
              <input type="text" placeholder="Enter an engaging title..." value={title} onChange={(e) => setTitle(e.target.value)} className="premium-title-input" />
              
              <div className="premium-rich-bar">
                <span onClick={() => applyFormatting("H")}>Heading</span> 
                <span onClick={() => applyFormatting("B")} style={{fontWeight:'bold'}}>Bold</span> 
                <span onClick={() => applyFormatting("I")} style={{fontStyle:'italic'}}>Italic</span> 
                <span onClick={() => applyFormatting("L")}>List</span> 
                <span onClick={() => applyFormatting("C")}>Code</span>
              </div>
              
              <textarea id="blog-editor-area" placeholder="Start writing your blog here..." value={content} onChange={(e) => setContent(e.target.value)} className="premium-textarea-editor" />
              <button className="premium-publish-btn" onClick={publishOrUpdateBlog}>
                {editingBlogId ? "💾 Save Absolute Changes" : "🚀 Publish Blog"}
              </button>
            </div>

            <div className="premium-content-box">
              <div className="panel-header-row">
                <h3>📚 Recent Content Logs</h3>
                <div className="search-bar-wrapper">
                  <input type="text" placeholder="Quick filter search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>
              {renderBlogsFeedList()}
            </div>
          </>
        )}

        {/* TAB 2: EXPLICIT VAULT OVERRIDE */}
        {activeTab === "blogs" && (
          <div className="premium-content-box">
            <div className="panel-header-row">
              <h3>📚 Master Database Logs Cluster ({blogs.length} Total)</h3>
              <div className="search-bar-wrapper">
                <input type="text" placeholder="Quick filter search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            {renderBlogsFeedList()}
          </div>
        )}

        {/* TAB 3: INSIGHTS & STATS */}
        {activeTab === "statistics" && (
          <div className="premium-content-box">
            <h3>📊 Live Analytics Matrix</h3>
            <p style={{color:'var(--text-muted)'}}>Total Production Blogs: <strong style={{color:'#fff'}}>{stats.totalBlogs} Records</strong></p>
            <p style={{color:'var(--text-muted)'}}>Active Retention Cycle Streak: <strong style={{color:'#fff'}}>{stats.streak} Days Running</strong></p>
          </div>
        )}

        {/* INTERACTION OVERLAY VIEW 1: DYNAMIC READER POPUP */}
        {selectedViewBlog && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(3,5,15,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(8px)'}}>
            <div style={{background:'#0b0d21', border:'1px solid rgba(255,255,255,0.08)', padding:'40px', borderRadius:'24px', maxWidth:'650px', width:'90%', boxSizing:'border-box', boxShadow:'0 25px 60px rgba(0,0,0,0.6)'}}>
              <h2 style={{marginTop:0, fontSize:'2rem', color:'#fff', fontWeight:800}}>{selectedViewBlog.title}</h2>
              <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'15px'}}>Indexed On: {new Date(selectedViewBlog.createdAt).toDateString()}</div>
              <hr style={{borderColor:'rgba(255,255,255,0.06)', margin:'15px 0'}} />
              <p style={{color:'#cbd5e1', lineHeight:'1.7', maxHeight:'320px', overflowY:'auto', whiteSpace:'pre-wrap', fontStyle:'normal', fontSize:'1.05rem'}}>{selectedViewBlog.content}</p>
              <button className="premium-publish-btn" style={{marginTop:'25px', width:'100%', textAlignment:'center'}} onClick={() => setSelectedViewBlog(null)}>Exit View Reader</button>
            </div>
          </div>
        )}

        {/* INTERACTION OVERLAY VIEW 2: SYSTEM MILESTONES ACHIEVEMENTS */}
        {showAchievements && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(3,5,15,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(8px)'}}>
            <div style={{background:'#0b0d21', border:'1px solid rgba(255,255,255,0.08)', padding:'40px', borderRadius:'24px', maxWidth:'480px', width:'90%', textAlignment:'center'}}>
              <h2 style={{marginTop:0, color:'#fff', fontWeight:800}}>🏅 System Rank Badges</h2>
              <p style={{color:'var(--text-muted)', marginBottom:'25px', fontSize:'0.9rem'}}>Dynamic tier unlocks evaluated on live record scale parameters.</p>
              
              <div style={{display:'flex', flexDirection:'column', gap:'15px', textAlign:'left', marginBottom:'30px'}}>
                <div style={{padding:'14px', background: stats.totalBlogs >= 1 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.01)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:'15px', alignItems:'center'}}>
                  <span style={{fontSize:'1.6rem'}}>{stats.totalBlogs >= 1 ? "✅" : "🔒"}</span>
                  <div>
                    <h4 style={{margin:0, color:'#fff', fontSize:'1rem'}}>Initiate Deployment</h4>
                    <span style={{fontSize:'0.78rem', color:'var(--text-muted)'}}>Pushed initial blog node in live architecture cluster</span>
                  </div>
                </div>

                <div style={{padding:'14px', background: stats.totalBlogs >= 5 ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.01)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.04)', display:'flex', gap:'15px', alignItems:'center'}}>
                  <span style={{fontSize:'1.6rem'}}>{stats.totalBlogs >= 5 ? "🔥" : "🔒"}</span>
                  <div>
                    <h4 style={{margin:0, color:'#fff', fontSize:'1rem'}}>Apex Vanguard Elite</h4>
                    <span style={{fontSize:'0.78rem', color:'var(--text-muted)'}}>Successfully scaled index to 5+ active production layers</span>
                  </div>
                </div>
              </div>
              <button className="premium-publish-btn" style={{margin:'0 auto', width:'100%'}} onClick={() => setShowAchievements(false)}>Dismiss Overview</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 