# ✦ Aarna — Collaborative Project Management

A full-stack project management tool (Jira/Trello style) with kanban boards, task management, comments, checklists, and real-time notifications.

---

## Project Structure

```
aarna-frontend/          # React + Vite frontend
  src/
    App.jsx              # All UI components
    main.jsx             # React entry point
  index.html
  vite.config.js
  package.json

aarna-backend/           # Node.js + Express REST API
  server.js              # All routes and business logic
  package.json
```

---

## Quick Start

### 1. Backend

```bash
cd aarna-backend
npm install
npm run dev          # starts on http://localhost:4000
# or: npm start
```

**Environment variables** (optional, set in `.env`):
```
PORT=4000
JWT_SECRET=your_strong_secret_here
NODE_ENV=production
```

### 2. Frontend

```bash
cd aarna-frontend
npm install
npm run dev          # starts on http://localhost:3000
```

The Vite proxy forwards `/api` requests to `http://localhost:4000` automatically.

---

## Demo Accounts

| Email              | Password | Role   |
|--------------------|----------|--------|
| aria@aarna.io      | demo123  | admin  |
| marcus@aarna.io    | demo123  | member |
| seren@aarna.io     | demo123  | member |
| ryo@aarna.io       | demo123  | member |

---

## API Reference

### Auth
| Method | Path                   | Body                        | Description       |
|--------|------------------------|-----------------------------|-------------------|
| POST   | /api/auth/login        | { email, password }         | Sign in, get JWT  |
| POST   | /api/auth/register     | { name, email, password }   | Create account    |

### Users
| Method | Path        | Description            |
|--------|-------------|------------------------|
| GET    | /api/users  | Get all workspace users |

### Projects
| Method | Path                | Body                   | Description          |
|--------|---------------------|------------------------|----------------------|
| GET    | /api/projects       | —                      | List user's projects |
| POST   | /api/projects       | { name, ... }          | Create project       |
| PUT    | /api/projects/:id   | Partial project fields | Update project       |
| DELETE | /api/projects/:id   | —                      | Delete project       |

### Tasks
| Method | Path                             | Body                   | Description    |
|--------|----------------------------------|------------------------|----------------|
| POST   | /api/projects/:projectId/tasks   | { title, columnId, ... } | Create task  |
| PUT    | /api/tasks/:id                   | Partial task fields    | Update task    |
| DELETE | /api/tasks/:id                   | —                      | Delete task    |

### Comments
| Method | Path                      | Body       | Description          |
|--------|---------------------------|------------|----------------------|
| POST   | /api/tasks/:id/comments   | { text }   | Add comment to task  |

### Notifications
| Method | Path                              | Description               |
|--------|-----------------------------------|---------------------------|
| GET    | /api/notifications                | Get user's notifications  |
| PUT    | /api/notifications/read-all       | Mark all as read          |
| PUT    | /api/notifications/:id/read       | Mark one as read          |

---

## Features

- **Kanban boards** — drag tasks across columns (Backlog → In Progress → Review → Done)
- **Task detail modal** — description, checklist with progress, comments, assignees, labels, due dates
- **Dashboard** — stats, recent tasks, project progress bars
- **My Tasks** — all tasks assigned to you, grouped by priority
- **Notifications** — real-time toast notifications + notifications panel
- **Projects** — create with custom color and team members
- **Auth** — JWT-based login/register with bcrypt password hashing
- **Search & filter** — search tasks by title, filter by priority

---

## Production Notes

1. **Database**: Replace the in-memory `db` object in `server.js` with PostgreSQL (via `pg` or `prisma`) or MongoDB (`mongoose`). The in-memory store resets on server restart.
2. **JWT Secret**: Set a strong `JWT_SECRET` environment variable.
3. **CORS**: Restrict `cors({ origin: "https://your-frontend-domain.com" })` for production.
4. **File uploads**: The `attachments` field is a count placeholder. Integrate S3 or Cloudflare R2 for actual file storage.
5. **WebSockets**: For real-time collaboration, add `socket.io` to the backend and emit events on task/project changes.
