import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-base: #0a0a0f;
      --bg-surface: #111118;
      --bg-elevated: #18181f;
      --bg-card: #1e1e27;
      --bg-hover: #252530;
      --bg-active: #2d2d3a;

      --accent-primary: #7c6af7;
      --accent-secondary: #a78bfa;
      --accent-glow: rgba(124,106,247,0.15);
      --accent-cyan: #22d3ee;
      --accent-emerald: #34d399;
      --accent-amber: #fbbf24;
      --accent-coral: #f87171;
      --accent-pink: #f472b6;

      --text-primary: #f1f0ff;
      --text-secondary: #9b99b8;
      --text-muted: #5c5a7a;
      --text-inverse: #0a0a0f;

      --border-subtle: rgba(255,255,255,0.05);
      --border-default: rgba(255,255,255,0.08);
      --border-strong: rgba(255,255,255,0.14);
      --border-accent: rgba(124,106,247,0.4);

      --shadow-sm: 0 1px 3px rgba(0,0,0,0.5);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.6);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.8);
      --shadow-accent: 0 0 20px rgba(124,106,247,0.2);

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-xl: 20px;
      --radius-full: 9999px;

      --font-display: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      --priority-critical: #f87171;
      --priority-high: #fbbf24;
      --priority-medium: #7c6af7;
      --priority-low: #34d399;
    }

    body { font-family: var(--font-body); background: var(--bg-base); color: var(--text-primary); min-height: 100vh; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-surface); }
    ::-webkit-scrollbar-thumb { background: var(--bg-active); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

    input, textarea, select {
      font-family: var(--font-body);
      background: var(--bg-elevated);
      border: 1px solid var(--border-default);
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      width: 100%;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    input::placeholder, textarea::placeholder { color: var(--text-muted); }

    button {
      font-family: var(--font-body);
      cursor: pointer;
      border: none;
      outline: none;
      transition: all 0.15s;
    }

    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes notif { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    @keyframes notifOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(20px); } }
    @keyframes badgePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(124,106,247,0.4); } 50% { box-shadow: 0 0 0 6px rgba(124,106,247,0); } }
  `}</style>
);

// ─── API SERVICE ─────────────────────────────────────────────────────────────
const API_BASE = "https://aarna-backend.onrender.com/api";
const api = {
  _token: () => localStorage.getItem("aarna_token"),
  _headers: () => ({
    "Content-Type": "application/json",
    ...(localStorage.getItem("aarna_token") ? { Authorization: `Bearer ${localStorage.getItem("aarna_token")}` } : {}),
  }),
  async request(method, path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: api._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
  get: (path) => api.request("GET", path),
  post: (path, body) => api.request("POST", path, body),
  put: (path, body) => api.request("PUT", path, body),
  delete: (path) => api.request("DELETE", path),

  // Auth
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (name, email, password) => api.post("/auth/register", { name, email, password }),

  // Users
  getUsers: () => api.get("/users"),

  // Projects
  getProjects: () => api.get("/projects"),
  createProject: (data) => api.post("/projects", data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),

  // Tasks
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),

  // Comments
  addComment: (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text }),

  // Notifications
  getNotifications: () => api.get("/notifications"),
  markAllRead: () => api.put("/notifications/read-all"),
};

// ─── SEED DATA (fallback/demo) ────────────────────────────────────────────────
const DEMO_USERS = [
  { id: "u1", name: "Aria Chen", email: "aria@aarna.io", avatar: "AC", color: "#7c6af7", role: "admin" },
  { id: "u2", name: "Marcus Webb", email: "marcus@aarna.io", avatar: "MW", color: "#22d3ee", role: "member" },
  { id: "u3", name: "Seren Patel", email: "seren@aarna.io", avatar: "SP", color: "#34d399", role: "member" },
  { id: "u4", name: "Ryo Tanaka", email: "ryo@aarna.io", avatar: "RT", color: "#f472b6", role: "member" },
];

const genId = () => Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return fmtDate(iso);
};

const DEMO_PROJECTS = [
  {
    id: "p1", name: "Aarna Platform v2", description: "Next-gen platform rebuild with real-time capabilities", color: "#7c6af7",
    members: ["u1", "u2", "u3"], owner: "u1", createdAt: now(), starred: true,
    columns: [
      { id: "c1", name: "Backlog", order: 0 },
      { id: "c2", name: "In Progress", order: 1 },
      { id: "c3", name: "Review", order: 2 },
      { id: "c4", name: "Done", order: 3 },
    ],
    tasks: [
      { id: "t1", columnId: "c1", title: "Design new auth flow", description: "Revamp the authentication UX with biometric support and seamless SSO integration.", priority: "high", assignees: ["u2"], labels: ["design", "auth"], dueDate: "2026-06-01", createdAt: now(), createdBy: "u1", attachments: 2, checklist: [{id:"ch1",text:"Wireframes",done:true},{id:"ch2",text:"Prototype",done:false},{id:"ch3",text:"User testing",done:false}], comments: [{id:"cm1",userId:"u1",text:"Let's prioritize biometric over passwordless this sprint.",createdAt:now()},{id:"cm2",userId:"u3",text:"Agreed, I'll start with the face-ID flow.",createdAt:now()}] },
      { id: "t2", columnId: "c2", title: "WebSocket infrastructure", description: "Build scalable WS layer with Redis pub/sub for real-time updates across all clients.", priority: "critical", assignees: ["u1"], labels: ["backend", "infrastructure"], dueDate: "2026-05-20", createdAt: now(), createdBy: "u1", attachments: 0, checklist: [{id:"ch4",text:"Redis setup",done:true},{id:"ch5",text:"Connection pooling",done:true},{id:"ch6",text:"Reconnect logic",done:false}], comments: [] },
      { id: "t3", columnId: "c2", title: "Dashboard analytics module", description: "Build real-time analytics with D3 charts and live data streaming.", priority: "medium", assignees: ["u3","u2"], labels: ["frontend", "analytics"], dueDate: "2026-05-28", createdAt: now(), createdBy: "u3", attachments: 1, checklist: [{id:"ch7",text:"Chart components",done:true},{id:"ch8",text:"Live data hooks",done:false}], comments: [] },
      { id: "t4", columnId: "c3", title: "API rate limiting", description: "Implement token bucket rate limiting with Redis and per-user/IP quotas.", priority: "high", assignees: ["u1"], labels: ["backend", "security"], dueDate: "2026-05-15", createdAt: now(), createdBy: "u2", attachments: 0, checklist: [{id:"ch9",text:"Token bucket impl",done:true},{id:"ch10",text:"Redis integration",done:true},{id:"ch11",text:"QA pass",done:false}], comments: [] },
      { id: "t5", columnId: "c4", title: "CI/CD pipeline setup", description: "GitHub Actions pipeline with staging/production environments.", priority: "low", assignees: ["u2"], labels: ["devops"], dueDate: "2026-05-10", createdAt: now(), createdBy: "u2", attachments: 3, checklist: [{id:"ch12",text:"GH Actions",done:true},{id:"ch13",text:"Staging env",done:true}], comments: [] },
    ]
  },
  {
    id: "p2", name: "Mobile App — iOS", description: "Native iOS app for the Aarna ecosystem", color: "#22d3ee",
    members: ["u1","u3","u4"], owner: "u3", createdAt: now(), starred: false,
    columns: [
      { id: "c5", name: "Todo", order: 0 },
      { id: "c6", name: "In Progress", order: 1 },
      { id: "c7", name: "Done", order: 2 },
    ],
    tasks: [
      { id: "t6", columnId: "c5", title: "Push notification system", description: "APNs integration with rich notifications and action buttons.", priority: "high", assignees: ["u4"], labels: ["ios", "notifications"], dueDate: "2026-06-10", createdAt: now(), createdBy: "u3", attachments: 0, checklist: [], comments: [] },
      { id: "t7", columnId: "c6", title: "Offline sync engine", description: "Local-first data layer with conflict resolution for offline support.", priority: "critical", assignees: ["u3","u4"], labels: ["ios", "sync"], dueDate: "2026-06-05", createdAt: now(), createdBy: "u3", attachments: 1, checklist: [{id:"ch14",text:"CoreData schema",done:true},{id:"ch15",text:"Sync protocol",done:false}], comments: [{id:"cm6",userId:"u4",text:"Using CRDTs for conflict resolution — much cleaner.",createdAt:now()}] },
    ]
  }
];

const LABELS = {
  "design": { color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  "auth": { color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  "backend": { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  "frontend": { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  "infrastructure": { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  "analytics": { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  "security": { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  "devops": { color: "#7c6af7", bg: "rgba(124,106,247,0.12)" },
  "ios": { color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  "notifications": { color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  "sync": { color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  "bug": { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  "feature": { color: "#7c6af7", bg: "rgba(124,106,247,0.12)" },
};

const PRIORITY_CONFIG = {
  critical: { color: "#f87171", label: "Critical", icon: "⬆⬆", weight: 0 },
  high: { color: "#fbbf24", label: "High", icon: "⬆", weight: 1 },
  medium: { color: "#7c6af7", label: "Medium", icon: "➡", weight: 2 },
  low: { color: "#34d399", label: "Low", icon: "⬇", weight: 3 },
};

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ─── COMPONENTS: ATOMS ────────────────────────────────────────────────────────
const Avatar = ({ userId, size = 28, showTooltip = false }) => {
  const { users } = useApp();
  const u = users.find(x => x.id === userId);
  if (!u) return null;
  return (
    <div title={showTooltip ? u.name : undefined} style={{
      width: size, height: size, borderRadius: "50%",
      background: u.color + "22", border: `2px solid ${u.color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600, color: u.color,
      fontFamily: "var(--font-display)", flexShrink: 0,
      userSelect: "none",
    }}>{u.avatar}</div>
  );
};

const Btn = ({ children, variant = "default", size = "md", onClick, disabled, style = {}, icon }) => {
  const variants = {
    primary: { bg: "var(--accent-primary)", color: "white", border: "none", hover: "#6c5ce7" },
    ghost: { bg: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)", hover: "var(--bg-hover)" },
    danger: { bg: "rgba(248,113,113,0.15)", color: "var(--accent-coral)", border: "1px solid rgba(248,113,113,0.3)", hover: "rgba(248,113,113,0.25)" },
    subtle: { bg: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", hover: "var(--bg-hover)" },
    default: { bg: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)", hover: "var(--bg-hover)" },
  };
  const v = variants[variant];
  const sizes = { sm: "6px 10px", md: "8px 14px", lg: "10px 20px" };
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? v.hover : v.bg, color: v.color, border: v.border,
        borderRadius: "var(--radius-sm)", padding: sizes[size],
        fontSize: size === "sm" ? 12 : size === "lg" ? 15 : 13,
        fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer",
        ...style
      }}
    >
      {icon && <span style={{ fontSize: size === "sm" ? 13 : 15 }}>{icon}</span>}
      {children}
    </button>
  );
};

const Badge = ({ children, color, bg }) => (
  <span style={{
    background: bg || "var(--bg-elevated)", color: color || "var(--text-secondary)",
    border: `1px solid ${color ? color + "40" : "var(--border-subtle)"}`,
    borderRadius: "var(--radius-full)", padding: "2px 8px",
    fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)",
    display: "inline-flex", alignItems: "center", letterSpacing: "0.02em",
  }}>{children}</span>
);

const PriorityDot = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      background: cfg.color,
      boxShadow: `0 0 6px ${cfg.color}80`,
      flexShrink: 0,
    }} title={cfg.label} />
  );
};

const LabelChip = ({ label }) => {
  const cfg = LABELS[label] || { color: "var(--text-muted)", bg: "var(--bg-elevated)" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: "var(--radius-full)", padding: "2px 7px",
      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{label}</span>
  );
};

// ─── NOTIFICATION SYSTEM ──────────────────────────────────────────────────────
const NotifContext = createContext(null);

const NotifProvider = ({ children }) => {
  const [notifs, setNotifs] = useState([]);
  const push = useCallback((msg, type = "info") => {
    const id = genId();
    setNotifs(p => [...p, { id, msg, type, exiting: false }]);
    setTimeout(() => {
      setNotifs(p => p.map(n => n.id === id ? { ...n, exiting: true } : n));
      setTimeout(() => setNotifs(p => p.filter(n => n.id !== id)), 300);
    }, 3500);
  }, []);
  const typeColors = { info: "var(--accent-primary)", success: "var(--accent-emerald)", warning: "var(--accent-amber)", error: "var(--accent-coral)" };
  return (
    <NotifContext.Provider value={push}>
      {children}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {notifs.map(n => (
          <div key={n.id} style={{
            background: "var(--bg-card)", border: `1px solid var(--border-default)`,
            borderLeft: `3px solid ${typeColors[n.type]}`,
            borderRadius: "var(--radius-md)", padding: "10px 14px",
            minWidth: 260, maxWidth: 340, boxShadow: "var(--shadow-lg)",
            animation: n.exiting ? "notifOut 0.3s forwards" : "notif 0.3s forwards",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 15, color: typeColors[n.type] }}>
              {n.type === "success" ? "✓" : n.type === "error" ? "✕" : n.type === "warning" ? "⚠" : "●"}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>{n.msg}</span>
          </div>
        ))}
      </div>
    </NotifContext.Provider>
  );
};
const useNotif = () => useContext(NotifContext);

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("aria@aarna.io");
  const [password, setPassword] = useState("demo123");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        if (!name || !email || !password) { setError("All fields required"); setLoading(false); return; }
        res = await api.register(name, email, password);
      }
      localStorage.setItem("aarna_token", res.token);
      onLogin(res.user);
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)",
      backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,106,247,0.12) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: 420, padding: 24, animation: "fadeIn 0.4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "var(--accent-glow)",
            border: "1px solid var(--border-accent)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px", fontSize: 28, fontWeight: 800,
            fontFamily: "var(--font-display)", color: "var(--accent-primary)",
          }}>✦</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            aarna<span style={{ color: "var(--accent-primary)" }}>.</span>work
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>Collaborative project management</p>
        </div>

        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-xl)", padding: 32, boxShadow: "var(--shadow-lg)",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 4, marginBottom: 24 }}>
            {["Sign In", "Sign Up"].map((t, i) => (
              <button key={t} onClick={() => { setIsLogin(!i); setError(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)",
                  background: isLogin === !i ? "var(--bg-card)" : "transparent",
                  color: isLogin === !i ? "var(--text-primary)" : "var(--text-muted)",
                  border: isLogin === !i ? "1px solid var(--border-default)" : "none",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  boxShadow: isLogin === !i ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s",
                }}>{t}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!isLogin && (
              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@aarna.io" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, display: "block", fontWeight: 500 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
            </div>

            {error && (
              <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 12, color: "var(--accent-coral)" }}>
                {error}
              </div>
            )}

            <button onClick={handle} disabled={loading} style={{
              width: "100%", padding: "11px", background: "var(--accent-primary)",
              color: "white", borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600,
              cursor: loading ? "wait" : "pointer", marginTop: 4, opacity: loading ? 0.8 : 1,
              letterSpacing: "0.01em", transition: "opacity 0.15s",
            }}>
              {loading ? "Authenticating…" : isLogin ? "Sign In" : "Create Account"}
            </button>
          </div>

          {isLogin && (
            <div style={{ marginTop: 20, padding: 12, background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Demo accounts:</strong>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ color: "var(--accent-secondary)" }}>aria@aarna.io</span>
                <span>/ demo123</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                <span style={{ color: "var(--accent-secondary)" }}>marcus@aarna.io</span>
                <span>/ demo123</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const SidebarItem = ({ label, icon, id, active, onClick, collapsed, badge }) => (
  <div onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10, padding: "8px",
    borderRadius: "var(--radius-sm)", cursor: "pointer",
    background: active ? "var(--bg-active)" : "transparent",
    position: "relative", transition: "background 0.12s",
  }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ fontSize: 15, flexShrink: 0, width: 20, textAlign: "center" }}>{icon}</span>
    {!collapsed && <span style={{ fontSize: 13, color: active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 500 : 400 }}>{label}</span>}
    {badge > 0 && (
      <div style={{
        marginLeft: "auto", background: "var(--accent-primary)", color: "white",
        borderRadius: "var(--radius-full)", fontSize: 10, fontWeight: 700,
        minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 5px", flexShrink: 0, animation: "badgePulse 2s infinite",
      }}>{badge}</div>
    )}
  </div>
);

const Sidebar = ({ currentUser, projects, activeProject, setActiveProject, onNewProject, onLogout, notifications }) => {
  const [collapsed, setCollapsed] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{
      width: collapsed ? 60 : 240, flexShrink: 0,
      background: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0, transition: "width 0.2s ease", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: "var(--accent-glow)",
          border: "1px solid var(--border-accent)", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0, fontSize: 16, color: "var(--accent-primary)",
          fontFamily: "var(--font-display)", fontWeight: 800,
        }}>✦</div>
        {!collapsed && (
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>
            aarna<span style={{ color: "var(--accent-primary)" }}>.</span>work
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginLeft: "auto", background: "none", color: "var(--text-muted)",
          fontSize: 16, padding: 4, borderRadius: 4, cursor: "pointer", flexShrink: 0,
        }}>{collapsed ? "→" : "←"}</button>
      </div>

      {/* Nav */}
      <div style={{ padding: "8px", flex: 1, overflowY: "auto" }}>
        {[
          { label: "Dashboard", icon: "⊞", id: "dashboard" },
          { label: "My Tasks", icon: "✓", id: "mytasks" },
          { label: "Notifications", icon: "🔔", id: "notifications", badge: unread },
        ].map(item => (
          <SidebarItem key={item.id} {...item} collapsed={collapsed} active={activeProject === item.id} onClick={() => setActiveProject(item.id)} />
        ))}

        {!collapsed && (
          <div style={{ margin: "16px 8px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Projects
          </div>
        )}
        {collapsed && <div style={{ height: 1, background: "var(--border-subtle)", margin: "8px 0" }} />}

        {projects.map(p => (
          <div key={p.id} onClick={() => setActiveProject(p.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px",
              borderRadius: "var(--radius-sm)", cursor: "pointer",
              background: activeProject === p.id ? "var(--bg-active)" : "transparent",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { if (activeProject !== p.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { if (activeProject !== p.id) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            {!collapsed && (
              <>
                <span style={{ fontSize: 13, color: activeProject === p.id ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                {p.starred && <span style={{ fontSize: 10, color: "var(--accent-amber)" }}>★</span>}
              </>
            )}
          </div>
        ))}

        <div onClick={onNewProject} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px",
          borderRadius: "var(--radius-sm)", cursor: "pointer", marginTop: 4,
          border: "1px dashed var(--border-default)", color: "var(--text-muted)",
          transition: "all 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>+</span>
          {!collapsed && <span style={{ fontSize: 13 }}>New Project</span>}
        </div>
      </div>

      {/* User */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar userId={currentUser.id} size={32} />
          {!collapsed && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{currentUser.role}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} title="Sign out" style={{ background: "none", color: "var(--text-muted)", fontSize: 16, padding: 4, cursor: "pointer", borderRadius: 4 }}>⏻</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ projects, currentUser }) => {
  const myTasks = projects.flatMap(p =>
    p.tasks.filter(t => t.assignees.includes(currentUser.id))
      .map(t => ({ ...t, projectName: p.name, projectColor: p.color }))
  );
  const stats = [
    { label: "Active Projects", value: projects.length, color: "var(--accent-primary)" },
    { label: "My Tasks", value: myTasks.length, color: "var(--accent-cyan)" },
    { label: "In Progress", value: myTasks.filter(t => projects.find(p => p.tasks.find(tk => tk.id === t.id))?.columns.find(c => c.id === t.columnId)?.name === "In Progress").length, color: "var(--accent-amber)" },
    { label: "Completed", value: myTasks.filter(t => projects.find(p => p.tasks.find(tk => tk.id === t.id))?.columns.find(c => c.id === t.columnId)?.name === "Done").length, color: "var(--accent-emerald)" },
  ];

  return (
    <div style={{ padding: 32, animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Good {new Date().getHours() < 12 ? "morning" : "evening"}, {currentUser.name.split(" ")[0]} 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>Here's what's happening across your workspace today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)", padding: "20px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ width: 3, position: "absolute", left: 0, top: 0, bottom: 0, background: s.color, borderRadius: "3px 0 0 3px" }} />
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--accent-primary)" }}>✓</span> My Recent Tasks
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myTasks.slice(0, 5).map(t => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}>
                <PriorityDot priority={t.priority} />
                <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                <div style={{ width: 6, height: 6, borderRadius: 2, background: t.projectColor, flexShrink: 0 }} title={t.projectName} />
              </div>
            ))}
            {myTasks.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No tasks assigned to you yet.</p>}
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--accent-cyan)" }}>⊞</span> Projects
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map(p => {
              const total = p.tasks.length;
              const done = p.tasks.filter(t => p.columns.find(c => c.id === t.columnId)?.name === "Done").length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{done}/{total}</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-hover)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: p.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TASK CARD ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onClick }) => {
  const doneChecks = task.checklist.filter(c => c.done).length;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div onClick={onClick} style={{
      background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)", padding: "12px", cursor: "pointer",
      transition: "all 0.15s", animation: "fadeIn 0.2s ease",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: PRIORITY_CONFIG[task.priority]?.color || "transparent", borderRadius: "var(--radius-md) var(--radius-md) 0 0", opacity: 0.7 }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <PriorityDot priority={task.priority} />
        <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, flex: 1, color: "var(--text-primary)" }}>{task.title}</p>
      </div>

      {task.labels.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {task.labels.map(l => <LabelChip key={l} label={l} />)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div style={{ display: "flex" }}>
          {task.assignees.slice(0, 3).map((uid, i) => (
            <div key={uid} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: task.assignees.length - i }}>
              <Avatar userId={uid} size={22} showTooltip />
            </div>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {task.checklist.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
              ✓ {doneChecks}/{task.checklist.length}
            </span>
          )}
          {task.comments.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>💬 {task.comments.length}</span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: 11, color: isOverdue ? "var(--accent-coral)" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {fmtDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── BOARD VIEW ───────────────────────────────────────────────────────────────
const BoardView = ({ project, currentUser, onUpdateProject, users }) => {
  const notif = useNotif();
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskCol, setNewTaskCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    const events = [
      () => notif(`${users[1]?.name} moved a task to Review`, "info"),
      () => notif(`${users[2]?.name} commented on a task`, "info"),
    ];
    const timers = events.map((fn, i) => setTimeout(fn, (i + 1) * 8000));
    return () => timers.forEach(clearTimeout);
  }, []);

  const filtered = (colId) => project.tasks
    .filter(t => t.columnId === colId)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .filter(t => filterPriority === "all" || t.priority === filterPriority);

  const addTask = async (colId) => {
    if (!newTaskTitle.trim()) return;
    const task = {
      id: genId(), columnId: colId, title: newTaskTitle,
      description: "", priority: "medium", assignees: [currentUser.id],
      labels: [], dueDate: null, createdAt: now(), createdBy: currentUser.id,
      attachments: 0, checklist: [], comments: [],
    };
    // Optimistic update
    onUpdateProject({ ...project, tasks: [...project.tasks, task] });
    setNewTaskTitle(""); setNewTaskCol(null);
    notif("Task created", "success");
    // API call
    try {
      await api.createTask(project.id, task);
    } catch (e) {
      notif("Failed to save task to server", "warning");
    }
  };

  const addColumn = () => {
    const name = prompt("Column name:");
    if (!name) return;
    const col = { id: genId(), name, order: project.columns.length };
    onUpdateProject({ ...project, columns: [...project.columns, col] });
    notif(`Column "${name}" added`, "success");
    api.updateProject(project.id, { columns: [...project.columns, col] }).catch(() => {});
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 12, background: "var(--bg-surface)", flexShrink: 0,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: project.color }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{project.name}</h2>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{project.tasks.length} tasks</span>

        <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--accent-emerald)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-emerald)", animation: "pulse 2s infinite" }} />
          Live
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" style={{ width: 180, height: 32, padding: "6px 10px" }} />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 110, height: 32, padding: "6px 8px", fontSize: 12 }}>
            <option value="all">All priority</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ display: "flex" }}>
            {project.members.slice(0, 4).map((uid, i) => (
              <div key={uid} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                <Avatar userId={uid} size={30} showTooltip />
              </div>
            ))}
          </div>
          <Btn variant="primary" size="sm" onClick={addColumn} icon="+">Column</Btn>
        </div>
      </div>

      {/* Columns */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflowX: "auto", padding: "20px 24px", background: "var(--bg-base)" }}>
        {project.columns.sort((a, b) => a.order - b.order).map((col, ci) => (
          <div key={col.id} style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", marginRight: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
              padding: "8px 10px", background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: ["var(--accent-primary)","var(--accent-amber)","var(--accent-pink)","var(--accent-emerald)"][ci % 4] }} />
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{col.name}</span>
              <span style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", borderRadius: "var(--radius-full)", padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>
                {filtered(col.id).length}
              </span>
              <button onClick={() => setNewTaskCol(col.id)} style={{ background: "none", color: "var(--text-muted)", fontSize: 16, cursor: "pointer", padding: "0 2px", borderRadius: 4, lineHeight: 1, transition: "color 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent-primary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >+</button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", paddingRight: 2 }}>
              {filtered(col.id).map(task => (
                <TaskCard key={task.id} task={task} onClick={() => setActiveTask(task)} />
              ))}

              {newTaskCol === col.id ? (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-accent)", borderRadius: "var(--radius-md)", padding: 10, animation: "fadeIn 0.15s ease" }}>
                  <textarea autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Task title…" rows={2}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTask(col.id); } if (e.key === "Escape") { setNewTaskCol(null); setNewTaskTitle(""); } }}
                    style={{ resize: "none", marginBottom: 8, fontSize: 13 }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="primary" size="sm" onClick={() => addTask(col.id)}>Add</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => { setNewTaskCol(null); setNewTaskTitle(""); }}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <button onClick={() => setNewTaskCol(col.id)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
                  border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)",
                  background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer",
                  transition: "all 0.15s", width: "100%",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >+ Add task</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeTask && (
        <TaskModal
          task={activeTask}
          project={project}
          currentUser={currentUser}
          users={users}
          onClose={() => setActiveTask(null)}
          onUpdate={(updated) => {
            const tasks = project.tasks.map(t => t.id === updated.id ? updated : t);
            onUpdateProject({ ...project, tasks });
            setActiveTask(updated);
            api.updateTask(updated.id, updated).catch(() => {});
          }}
          onDelete={(id) => {
            onUpdateProject({ ...project, tasks: project.tasks.filter(t => t.id !== id) });
            setActiveTask(null);
            notif("Task deleted", "info");
            api.deleteTask(id).catch(() => {});
          }}
        />
      )}
    </div>
  );
};

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
    {children}
  </div>
);

const TaskModal = ({ task, project, currentUser, users, onClose, onUpdate, onDelete }) => {
  const notif = useNotif();
  const [t, setT] = useState(task);
  const [comment, setComment] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");

  const save = (updates) => {
    const updated = { ...t, ...updates };
    setT(updated);
    onUpdate(updated);
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    const cm = { id: genId(), userId: currentUser.id, text: comment, createdAt: now() };
    save({ comments: [...t.comments, cm] });
    setComment("");
    notif("Comment added", "success");
    try { await api.addComment(t.id, comment); } catch (e) {}
  };

  const toggleCheck = (cid) => {
    save({ checklist: t.checklist.map(c => c.id === cid ? { ...c, done: !c.done } : c) });
  };

  const addCheckItem = () => {
    const text = prompt("Checklist item:");
    if (!text) return;
    save({ checklist: [...t.checklist, { id: genId(), text, done: false }] });
  };

  const moveTask = (colId) => {
    save({ columnId: colId });
    notif(`Task moved to ${project.columns.find(c => c.id === colId)?.name}`, "info");
  };

  const doneChecks = t.checklist.filter(c => c.done).length;
  const checkPct = t.checklist.length ? Math.round((doneChecks / t.checklist.length) * 100) : 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "40px 20px", overflowY: "auto",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 700,
        boxShadow: "var(--shadow-lg)", animation: "fadeIn 0.2s ease", overflow: "hidden",
      }}>
        <div style={{ height: 3, background: PRIORITY_CONFIG[t.priority]?.color }} />

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            {editTitle ? (
              <input autoFocus value={t.title} onChange={e => setT({ ...t, title: e.target.value })}
                onBlur={() => { save({ title: t.title }); setEditTitle(false); }}
                onKeyDown={e => e.key === "Enter" && (save({ title: t.title }), setEditTitle(false))}
                style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", flex: 1 }}
              />
            ) : (
              <h2 onClick={() => setEditTitle(true)} style={{
                fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700,
                letterSpacing: "-0.02em", flex: 1, cursor: "text", lineHeight: 1.3,
              }}>{t.title}</h2>
            )}
            <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {t.labels.map(l => <LabelChip key={l} label={l} />)}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 0 }}>
          {/* Main */}
          <div style={{ padding: 24, borderRight: "1px solid var(--border-subtle)" }}>
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Description</h4>
              <textarea value={t.description} onChange={e => setT({ ...t, description: e.target.value })}
                onBlur={() => save({ description: t.description })}
                placeholder="Add a description…" rows={3}
                style={{ resize: "vertical", fontSize: 13, lineHeight: 1.6 }}
              />
            </div>

            {t.checklist.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Checklist — {checkPct}%
                  </h4>
                  <Btn size="sm" variant="ghost" onClick={addCheckItem} icon="+">Item</Btn>
                </div>
                <div style={{ height: 3, background: "var(--bg-hover)", borderRadius: 2, marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${checkPct}%`, background: checkPct === 100 ? "var(--accent-emerald)" : "var(--accent-primary)", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {t.checklist.map(c => (
                    <div key={c.id} onClick={() => toggleCheck(c.id)} style={{
                      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                      padding: "6px 8px", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)",
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${c.done ? "var(--accent-emerald)" : "var(--border-strong)"}`,
                        background: c.done ? "var(--accent-emerald)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: 10, transition: "all 0.15s",
                      }}>{c.done ? "✓" : ""}</div>
                      <span style={{ fontSize: 13, textDecoration: c.done ? "line-through" : "none", color: c.done ? "var(--text-muted)" : "var(--text-primary)" }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {["activity", "attachments"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  background: activeTab === tab ? "var(--bg-elevated)" : "transparent",
                  color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                  border: activeTab === tab ? "1px solid var(--border-default)" : "1px solid transparent",
                  borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  textTransform: "capitalize",
                }}>{tab}</button>
              ))}
            </div>

            {activeTab === "activity" && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, maxHeight: 260, overflowY: "auto" }}>
                  {t.comments.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No activity yet.</p>}
                  {t.comments.map(cm => {
                    const u = users.find(x => x.id === cm.userId);
                    return (
                      <div key={cm.id} style={{ display: "flex", gap: 10, animation: "slideIn 0.2s ease" }}>
                        <Avatar userId={cm.userId} size={28} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{u?.name}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{fmtRelative(cm.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: 13, lineHeight: 1.5, background: "var(--bg-elevated)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>{cm.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Avatar userId={currentUser.id} size={28} />
                  <div style={{ flex: 1, display: "flex", gap: 6 }}>
                    <input value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Write a comment…" style={{ flex: 1, height: 34 }}
                      onKeyDown={e => e.key === "Enter" && addComment()} />
                    <Btn variant="primary" size="sm" onClick={addComment}>Send</Btn>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                {t.attachments > 0 ? `${t.attachments} attachment(s)` : "No attachments"}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-elevated)" }}>
            <Field label="Status">
              <select value={t.columnId} onChange={e => moveTask(e.target.value)} style={{ height: 32, padding: "4px 8px", fontSize: 12 }}>
                {project.columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="Priority">
              <select value={t.priority} onChange={e => save({ priority: e.target.value })} style={{ height: 32, padding: "4px 8px", fontSize: 12 }}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>

            <Field label="Assignees">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {users.map(u => (
                  <div key={u.id} onClick={() => {
                    const has = t.assignees.includes(u.id);
                    save({ assignees: has ? t.assignees.filter(id => id !== u.id) : [...t.assignees, u.id] });
                  }} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "4px 6px",
                    borderRadius: "var(--radius-sm)", cursor: "pointer",
                    background: t.assignees.includes(u.id) ? "var(--accent-glow)" : "transparent",
                    border: `1px solid ${t.assignees.includes(u.id) ? "var(--border-accent)" : "transparent"}`,
                    transition: "all 0.12s",
                  }}>
                    <Avatar userId={u.id} size={22} />
                    <span style={{ fontSize: 12, flex: 1 }}>{u.name}</span>
                    {t.assignees.includes(u.id) && <span style={{ fontSize: 12, color: "var(--accent-primary)" }}>✓</span>}
                  </div>
                ))}
              </div>
            </Field>

            <Field label="Due Date">
              <input type="date" value={t.dueDate || ""} onChange={e => save({ dueDate: e.target.value })}
                style={{ height: 32, padding: "4px 8px", fontSize: 12 }} />
            </Field>

            <Field label="Labels">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.keys(LABELS).slice(0, 8).map(l => (
                  <div key={l} onClick={() => {
                    const has = t.labels.includes(l);
                    save({ labels: has ? t.labels.filter(x => x !== l) : [...t.labels, l] });
                  }} style={{ cursor: "pointer", opacity: t.labels.includes(l) ? 1 : 0.4, transition: "opacity 0.15s" }}>
                    <LabelChip label={l} />
                  </div>
                ))}
              </div>
            </Field>

            <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
              <Btn variant="danger" size="sm" onClick={() => { if (confirm("Delete this task?")) onDelete(t.id); }} style={{ width: "100%", justifyContent: "center" }}>
                Delete Task
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
const NotificationsPanel = ({ notifications, onMarkRead }) => (
  <div style={{ padding: 32, maxWidth: 600, animation: "fadeIn 0.3s ease" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>Notifications</h1>
      <Btn size="sm" variant="ghost" onClick={onMarkRead}>Mark all read</Btn>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {notifications.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>All caught up! 🎉</p>}
      {notifications.map(n => (
        <div key={n.id} style={{
          display: "flex", gap: 14, padding: "14px 16px",
          background: n.read ? "var(--bg-surface)" : "var(--bg-card)",
          border: `1px solid ${n.read ? "var(--border-subtle)" : "var(--border-accent)"}`,
          borderRadius: "var(--radius-md)", transition: "all 0.2s",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: n.read ? "transparent" : "var(--accent-primary)", marginTop: 5, border: n.read ? "1px solid var(--border-default)" : "none" }} />
          <div>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>{n.message}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-mono)" }}>{fmtRelative(n.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── MY TASKS VIEW ────────────────────────────────────────────────────────────
const MyTasksView = ({ projects, currentUser }) => {
  const myTasks = projects.flatMap(p =>
    p.tasks.filter(t => t.assignees.includes(currentUser.id))
      .map(t => ({ ...t, projectName: p.name, projectColor: p.color, colName: p.columns.find(c => c.id === t.columnId)?.name }))
  ).sort((a, b) => (PRIORITY_CONFIG[a.priority]?.weight || 0) - (PRIORITY_CONFIG[b.priority]?.weight || 0));

  const grouped = {
    "Critical & High": myTasks.filter(t => ["critical", "high"].includes(t.priority)),
    "Medium": myTasks.filter(t => t.priority === "medium"),
    "Low": myTasks.filter(t => t.priority === "low"),
  };

  return (
    <div style={{ padding: 32, animation: "fadeIn 0.3s ease", maxWidth: 800 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>My Tasks</h1>
      {Object.entries(grouped).map(([group, tasks]) => tasks.length > 0 && (
        <div key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{group} — {tasks.length}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tasks.map(t => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)", animation: "slideIn 0.2s ease",
              }}>
                <PriorityDot priority={t.priority} />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: "var(--radius-full)" }}>{t.colName}</span>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: t.projectColor }} title={t.projectName} />
                {t.dueDate && <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{fmtDate(t.dueDate)}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {myTasks.length === 0 && <p style={{ color: "var(--text-muted)" }}>No tasks assigned to you yet.</p>}
    </div>
  );
};

// ─── NEW PROJECT MODAL ────────────────────────────────────────────────────────
const NewProjectModal = ({ users, currentUser, onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#7c6af7");
  const [members, setMembers] = useState([currentUser.id]);
  const COLORS = ["#7c6af7", "#22d3ee", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#a78bfa"];

  const create = () => {
    if (!name.trim()) return;
    onCreate({
      id: genId(), name, description, color, members, owner: currentUser.id,
      createdAt: now(), starred: false,
      columns: [
        { id: genId(), name: "Backlog", order: 0 },
        { id: genId(), name: "In Progress", order: 1 },
        { id: genId(), name: "Review", order: 2 },
        { id: genId(), name: "Done", order: 3 },
      ],
      tasks: [],
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-xl)", padding: 28, width: 440,
        animation: "fadeIn 0.2s ease", boxShadow: "var(--shadow-lg)",
      }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>New Project</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Platform Redesign" autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief project description…" rows={2} style={{ resize: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Color</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                  border: color === c ? `3px solid white` : "3px solid transparent",
                  boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                  transition: "all 0.15s",
                }} />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Members</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {users.map(u => (
                <div key={u.id} onClick={() => {
                  if (u.id === currentUser.id) return;
                  setMembers(p => p.includes(u.id) ? p.filter(id => id !== u.id) : [...p, u.id]);
                }} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
                  borderRadius: "var(--radius-sm)", cursor: u.id === currentUser.id ? "default" : "pointer",
                  background: members.includes(u.id) ? "var(--accent-glow)" : "var(--bg-elevated)",
                  border: `1px solid ${members.includes(u.id) ? "var(--border-accent)" : "var(--border-subtle)"}`,
                  transition: "all 0.12s",
                }}>
                  <Avatar userId={u.id} size={24} />
                  <span style={{ fontSize: 13, flex: 1 }}>{u.name}</span>
                  {members.includes(u.id) && <span style={{ fontSize: 12, color: "var(--accent-primary)" }}>✓</span>}
                  {u.id === currentUser.id && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Owner</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" onClick={create} disabled={!name.trim()}>Create Project</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(DEMO_USERS);
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState("dashboard");
  const [showNewProject, setShowNewProject] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem("aarna_token");
    const savedUser = localStorage.getItem("aarna_user");
    if (token && savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
  }, []);

  // Load data once logged in
  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem("aarna_user", JSON.stringify(currentUser));
    setLoading(true);
    Promise.all([
      api.getProjects().catch(() => DEMO_PROJECTS),
      api.getUsers().catch(() => DEMO_USERS),
      api.getNotifications().catch(() => [
        { id: genId(), message: "Welcome to Aarna! Check out your demo projects.", read: false, createdAt: now() },
        { id: genId(), message: `${DEMO_USERS[1].name} assigned you to 'WebSocket infrastructure'`, read: false, createdAt: now() },
      ]),
    ]).then(([projs, usrs, notifs]) => {
      setProjects(projs);
      setUsers(usrs);
      setNotifications(notifs);
      setLoading(false);
    });
  }, [currentUser]);

  const updateProject = useCallback((updated) => {
    setProjects(p => p.map(proj => proj.id === updated.id ? updated : proj));
    api.updateProject(updated.id, updated).catch(() => {});
  }, []);

  const createProject = async (proj) => {
    setProjects(p => [...p, proj]);
    setActiveId(proj.id);
    setShowNewProject(false);
    setNotifications(n => [{ id: genId(), message: `Project "${proj.name}" created`, read: false, createdAt: now() }, ...n]);
    try { await api.createProject(proj); } catch (e) {}
  };

  const handleLogin = (user) => setCurrentUser(user);

  const handleLogout = () => {
    localStorage.removeItem("aarna_token");
    localStorage.removeItem("aarna_user");
    setCurrentUser(null);
    setProjects([]);
    setNotifications([]);
  };

  if (!currentUser) {
    return (
      <AppCtx.Provider value={{ users }}>
        <NotifProvider>
          <GlobalStyle />
          <AuthScreen onLogin={handleLogin} />
        </NotifProvider>
      </AppCtx.Provider>
    );
  }

  if (loading) {
    return (
      <AppCtx.Provider value={{ users }}>
        <NotifProvider>
          <GlobalStyle />
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 16, animation: "spin 1s linear infinite", display: "inline-block" }}>✦</div>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading workspace…</p>
            </div>
          </div>
        </NotifProvider>
      </AppCtx.Provider>
    );
  }

  const activeProject = projects.find(p => p.id === activeId);

  return (
    <AppCtx.Provider value={{ users, currentUser }}>
      <NotifProvider>
        <GlobalStyle />
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
          <Sidebar
            currentUser={currentUser}
            projects={projects}
            activeProject={activeId}
            setActiveProject={setActiveId}
            onNewProject={() => setShowNewProject(true)}
            onLogout={handleLogout}
            notifications={notifications}
          />

          <main style={{ flex: 1, overflow: "hidden" }}>
            {activeId === "dashboard" && <Dashboard projects={projects} currentUser={currentUser} />}
            {activeId === "mytasks" && <MyTasksView projects={projects} currentUser={currentUser} />}
            {activeId === "notifications" && (
              <NotificationsPanel
                notifications={notifications}
                onMarkRead={() => {
                  setNotifications(n => n.map(x => ({ ...x, read: true })));
                  api.markAllRead().catch(() => {});
                }}
              />
            )}
            {activeProject && (
              <BoardView
                key={activeProject.id}
                project={activeProject}
                currentUser={currentUser}
                users={users}
                onUpdateProject={updateProject}
              />
            )}
          </main>
        </div>

        {showNewProject && (
          <NewProjectModal
            users={users}
            currentUser={currentUser}
            onClose={() => setShowNewProject(false)}
            onCreate={createProject}
          />
        )}
      </NotifProvider>
    </AppCtx.Provider>
  );
}
