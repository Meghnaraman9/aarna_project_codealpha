/**
 * Aarna — Project Management API
 * Node.js + Express backend
 *
 * Endpoints:
 *   POST   /api/auth/login
 *   POST   /api/auth/register
 *   GET    /api/users
 *   GET    /api/projects
 *   POST   /api/projects
 *   PUT    /api/projects/:id
 *   DELETE /api/projects/:id
 *   POST   /api/projects/:projectId/tasks
 *   PUT    /api/tasks/:id
 *   DELETE /api/tasks/:id
 *   POST   /api/tasks/:id/comments
 *   GET    /api/notifications
 *   PUT    /api/notifications/read-all
 */

"use strict";

const express    = require("express");
const cors       = require("cors");
const morgan     = require("morgan");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const PORT       = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "aarna_secret_change_in_production";
const JWT_EXPIRY = "7d";
const SALT_ROUNDS = 10;

// ─── IN-MEMORY STORE ─────────────────────────────────────────────────────────
// Replace with a database (PostgreSQL, MongoDB, SQLite) for production.

const now = () => new Date().toISOString();

const db = {
  users: [
    { id: "u1", name: "Aria Chen",    email: "aria@aarna.io",   passwordHash: bcrypt.hashSync("demo123", SALT_ROUNDS), avatar: "AC", color: "#7c6af7", role: "admin",  createdAt: now() },
    { id: "u2", name: "Marcus Webb",  email: "marcus@aarna.io", passwordHash: bcrypt.hashSync("demo123", SALT_ROUNDS), avatar: "MW", color: "#22d3ee", role: "member", createdAt: now() },
    { id: "u3", name: "Seren Patel",  email: "seren@aarna.io",  passwordHash: bcrypt.hashSync("demo123", SALT_ROUNDS), avatar: "SP", color: "#34d399", role: "member", createdAt: now() },
    { id: "u4", name: "Ryo Tanaka",   email: "ryo@aarna.io",    passwordHash: bcrypt.hashSync("demo123", SALT_ROUNDS), avatar: "RT", color: "#f472b6", role: "member", createdAt: now() },
  ],

  projects: [
    {
      id: "p1", name: "Aarna Platform v2",
      description: "Next-gen platform rebuild with real-time capabilities",
      color: "#7c6af7", members: ["u1","u2","u3"], owner: "u1",
      createdAt: now(), starred: true,
      columns: [
        { id: "c1", name: "Backlog",     order: 0 },
        { id: "c2", name: "In Progress", order: 1 },
        { id: "c3", name: "Review",      order: 2 },
        { id: "c4", name: "Done",        order: 3 },
      ],
      tasks: [
        {
          id: "t1", columnId: "c1", title: "Design new auth flow",
          description: "Revamp the authentication UX with biometric support and SSO.",
          priority: "high", assignees: ["u2"], labels: ["design","auth"],
          dueDate: "2026-06-01", createdAt: now(), createdBy: "u1",
          attachments: 2,
          checklist: [
            { id: "ch1", text: "Wireframes",    done: true  },
            { id: "ch2", text: "Prototype",     done: false },
            { id: "ch3", text: "User testing",  done: false },
          ],
          comments: [
            { id: "cm1", userId: "u1", text: "Let's prioritize biometric this sprint.", createdAt: now() },
            { id: "cm2", userId: "u3", text: "Agreed, I'll start with the face-ID flow.", createdAt: now() },
          ],
        },
        {
          id: "t2", columnId: "c2", title: "WebSocket infrastructure",
          description: "Scalable WS layer with Redis pub/sub for real-time updates.",
          priority: "critical", assignees: ["u1"], labels: ["backend","infrastructure"],
          dueDate: "2026-05-20", createdAt: now(), createdBy: "u1",
          attachments: 0,
          checklist: [
            { id: "ch4", text: "Redis setup",       done: true  },
            { id: "ch5", text: "Connection pooling", done: true  },
            { id: "ch6", text: "Reconnect logic",   done: false },
          ],
          comments: [],
        },
        {
          id: "t3", columnId: "c2", title: "Dashboard analytics module",
          description: "Real-time analytics with D3 charts and live data streaming.",
          priority: "medium", assignees: ["u3","u2"], labels: ["frontend","analytics"],
          dueDate: "2026-05-28", createdAt: now(), createdBy: "u3",
          attachments: 1,
          checklist: [
            { id: "ch7", text: "Chart components", done: true  },
            { id: "ch8", text: "Live data hooks",  done: false },
          ],
          comments: [],
        },
        {
          id: "t4", columnId: "c3", title: "API rate limiting",
          description: "Token bucket rate limiting with Redis and per-user/IP quotas.",
          priority: "high", assignees: ["u1"], labels: ["backend","security"],
          dueDate: "2026-05-15", createdAt: now(), createdBy: "u2",
          attachments: 0,
          checklist: [
            { id: "ch9",  text: "Token bucket impl",  done: true  },
            { id: "ch10", text: "Redis integration",  done: true  },
            { id: "ch11", text: "QA pass",            done: false },
          ],
          comments: [],
        },
        {
          id: "t5", columnId: "c4", title: "CI/CD pipeline setup",
          description: "GitHub Actions pipeline with staging/production environments.",
          priority: "low", assignees: ["u2"], labels: ["devops"],
          dueDate: "2026-05-10", createdAt: now(), createdBy: "u2",
          attachments: 3,
          checklist: [
            { id: "ch12", text: "GH Actions",  done: true },
            { id: "ch13", text: "Staging env", done: true },
          ],
          comments: [],
        },
      ],
    },
    {
      id: "p2", name: "Mobile App — iOS",
      description: "Native iOS app for the Aarna ecosystem",
      color: "#22d3ee", members: ["u1","u3","u4"], owner: "u3",
      createdAt: now(), starred: false,
      columns: [
        { id: "c5", name: "Todo",        order: 0 },
        { id: "c6", name: "In Progress", order: 1 },
        { id: "c7", name: "Done",        order: 2 },
      ],
      tasks: [
        {
          id: "t6", columnId: "c5", title: "Push notification system",
          description: "APNs integration with rich notifications and action buttons.",
          priority: "high", assignees: ["u4"], labels: ["ios","notifications"],
          dueDate: "2026-06-10", createdAt: now(), createdBy: "u3",
          attachments: 0, checklist: [], comments: [],
        },
        {
          id: "t7", columnId: "c6", title: "Offline sync engine",
          description: "Local-first data layer with conflict resolution.",
          priority: "critical", assignees: ["u3","u4"], labels: ["ios","sync"],
          dueDate: "2026-06-05", createdAt: now(), createdBy: "u3",
          attachments: 1,
          checklist: [
            { id: "ch14", text: "CoreData schema", done: true  },
            { id: "ch15", text: "Sync protocol",   done: false },
          ],
          comments: [
            { id: "cm6", userId: "u4", text: "Using CRDTs for conflict resolution.", createdAt: now() },
          ],
        },
      ],
    },
  ],

  notifications: [
    { id: uuidv4(), userId: "u1", message: "Welcome to Aarna! Check out your demo projects.", read: false, createdAt: now() },
    { id: uuidv4(), userId: "u1", message: "Marcus Webb assigned you to 'WebSocket infrastructure'", read: false, createdAt: now() },
    { id: uuidv4(), userId: "u1", message: "Seren Patel commented on 'Dashboard analytics module'", read: true, createdAt: now() },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const safeUser = (u) => {
  const { passwordHash, ...rest } = u;
  return rest;
};

const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ 
  origin: "https://aarna-project-codealpha1.vercel.app",
  credentials: true 
}));
app.use(express.json());
app.use(morgan("dev"));

// Auth middleware — attach req.user if valid token present
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const user = db.users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ app: "Aarna API", version: "1.0.0", status: "ok" });
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user.id);
  res.json({ token, user: safeUser(user) });
});

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Returns: { token, user }
 */
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const initials = name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#7c6af7","#22d3ee","#34d399","#fbbf24","#f87171","#f472b6","#a78bfa"];
  const color = colors[db.users.length % colors.length];

  const newUser = {
    id: uuidv4(), name, email, passwordHash,
    avatar: initials, color, role: "member", createdAt: now(),
  };
  db.users.push(newUser);

  const token = signToken(newUser.id);
  res.status(201).json({ token, user: safeUser(newUser) });
});

// ─── USER ROUTES ──────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Returns: [User] (no password hashes)
 */
app.get("/api/users", requireAuth, (req, res) => {
  res.json(db.users.map(safeUser));
});

// ─── PROJECT ROUTES ───────────────────────────────────────────────────────────

/**
 * GET /api/projects
 * Returns projects where current user is owner or member.
 */
app.get("/api/projects", requireAuth, (req, res) => {
  const userId = req.user.id;
  const projects = db.projects.filter(p =>
    p.owner === userId || p.members.includes(userId)
  );
  res.json(projects);
});

/**
 * POST /api/projects
 * Body: { name, description, color, members, columns?, tasks? }
 */
app.post("/api/projects", requireAuth, (req, res) => {
  const { name, description, color, members, columns, tasks, starred } = req.body;
  if (!name) return res.status(400).json({ error: "Project name required" });

  const project = {
    id: req.body.id || uuidv4(),
    name,
    description: description || "",
    color: color || "#7c6af7",
    members: members || [req.user.id],
    owner: req.user.id,
    createdAt: now(),
    starred: starred || false,
    columns: columns || [
      { id: uuidv4(), name: "Backlog",     order: 0 },
      { id: uuidv4(), name: "In Progress", order: 1 },
      { id: uuidv4(), name: "Review",      order: 2 },
      { id: uuidv4(), name: "Done",        order: 3 },
    ],
    tasks: tasks || [],
  };

  db.projects.push(project);

  // Notify members
  (project.members || []).forEach(uid => {
    if (uid !== req.user.id) {
      db.notifications.push({
        id: uuidv4(), userId: uid,
        message: `${req.user.name} added you to project "${project.name}"`,
        read: false, createdAt: now(),
      });
    }
  });

  res.status(201).json(project);
});

/**
 * PUT /api/projects/:id
 * Body: Partial project fields to update
 */
app.put("/api/projects/:id", requireAuth, (req, res) => {
  const idx = db.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });

  const project = db.projects[idx];
  // Only owner or member can update
  if (project.owner !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Merge updates (don't allow changing id/owner)
  const { id, owner, createdAt, ...updates } = req.body;
  db.projects[idx] = { ...project, ...updates };
  res.json(db.projects[idx]);
});

/**
 * DELETE /api/projects/:id
 */
app.delete("/api/projects/:id", requireAuth, (req, res) => {
  const idx = db.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Project not found" });

  if (db.projects[idx].owner !== req.user.id) {
    return res.status(403).json({ error: "Only the project owner can delete it" });
  }

  db.projects.splice(idx, 1);
  res.json({ success: true });
});

// ─── TASK ROUTES ──────────────────────────────────────────────────────────────

/**
 * POST /api/projects/:projectId/tasks
 * Body: { title, columnId, description?, priority?, assignees?, labels?, dueDate? }
 */
app.post("/api/projects/:projectId/tasks", requireAuth, (req, res) => {
  const project = db.projects.find(p => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (!project.members.includes(req.user.id) && project.owner !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { title, columnId, description, priority, assignees, labels, dueDate, checklist, id } = req.body;
  if (!title) return res.status(400).json({ error: "Task title required" });

  const task = {
    id: id || uuidv4(),
    columnId: columnId || (project.columns[0]?.id || null),
    title,
    description: description || "",
    priority: priority || "medium",
    assignees: assignees || [req.user.id],
    labels: labels || [],
    dueDate: dueDate || null,
    createdAt: now(),
    createdBy: req.user.id,
    attachments: 0,
    checklist: checklist || [],
    comments: [],
  };

  project.tasks.push(task);

  // Notify assignees
  (task.assignees || []).forEach(uid => {
    if (uid !== req.user.id) {
      db.notifications.push({
        id: uuidv4(), userId: uid,
        message: `${req.user.name} assigned you to "${task.title}"`,
        read: false, createdAt: now(),
      });
    }
  });

  res.status(201).json(task);
});

/**
 * PUT /api/tasks/:id
 * Body: Partial task fields
 */
app.put("/api/tasks/:id", requireAuth, (req, res) => {
  let foundTask = null;
  let foundProject = null;

  for (const project of db.projects) {
    const idx = project.tasks.findIndex(t => t.id === req.params.id);
    if (idx !== -1) {
      foundTask = { project, idx };
      foundProject = project;
      break;
    }
  }

  if (!foundTask) return res.status(404).json({ error: "Task not found" });

  if (!foundProject.members.includes(req.user.id) && foundProject.owner !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { id, createdAt, createdBy, ...updates } = req.body;
  foundProject.tasks[foundTask.idx] = { ...foundProject.tasks[foundTask.idx], ...updates };
  res.json(foundProject.tasks[foundTask.idx]);
});

/**
 * DELETE /api/tasks/:id
 */
app.delete("/api/tasks/:id", requireAuth, (req, res) => {
  for (const project of db.projects) {
    const idx = project.tasks.findIndex(t => t.id === req.params.id);
    if (idx !== -1) {
      if (!project.members.includes(req.user.id) && project.owner !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      project.tasks.splice(idx, 1);
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: "Task not found" });
});

// ─── COMMENT ROUTES ───────────────────────────────────────────────────────────

/**
 * POST /api/tasks/:id/comments
 * Body: { text }
 */
app.post("/api/tasks/:id/comments", requireAuth, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "Comment text required" });

  for (const project of db.projects) {
    const task = project.tasks.find(t => t.id === req.params.id);
    if (task) {
      if (!project.members.includes(req.user.id) && project.owner !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const comment = {
        id: uuidv4(),
        userId: req.user.id,
        text: text.trim(),
        createdAt: now(),
      };
      task.comments.push(comment);

      // Notify task assignees
      task.assignees.forEach(uid => {
        if (uid !== req.user.id) {
          db.notifications.push({
            id: uuidv4(), userId: uid,
            message: `${req.user.name} commented on "${task.title}"`,
            read: false, createdAt: now(),
          });
        }
      });

      return res.status(201).json(comment);
    }
  }
  res.status(404).json({ error: "Task not found" });
});

// ─── NOTIFICATION ROUTES ──────────────────────────────────────────────────────

/**
 * GET /api/notifications
 * Returns notifications for the current user.
 */
app.get("/api/notifications", requireAuth, (req, res) => {
  const userNotifs = db.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(userNotifs);
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user.
 */
app.put("/api/notifications/read-all", requireAuth, (req, res) => {
  db.notifications.forEach(n => {
    if (n.userId === req.user.id) n.read = true;
  });
  res.json({ success: true });
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read.
 */
app.put("/api/notifications/:id/read", requireAuth, (req, res) => {
  const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (!notif) return res.status(404).json({ error: "Notification not found" });
  notif.read = true;
  res.json(notif);
});

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ✦  Aarna API is running
  ──────────────────────────
  URL  : http://localhost:${PORT}
  Env  : ${process.env.NODE_ENV || "development"}
  Users: aria@aarna.io / demo123
         marcus@aarna.io / demo123

  Endpoints:
    POST   /api/auth/login
    POST   /api/auth/register
    GET    /api/users
    GET    /api/projects
    POST   /api/projects
    PUT    /api/projects/:id
    DELETE /api/projects/:id
    POST   /api/projects/:id/tasks
    PUT    /api/tasks/:id
    DELETE /api/tasks/:id
    POST   /api/tasks/:id/comments
    GET    /api/notifications
    PUT    /api/notifications/read-all
  `);
});

module.exports = app;
