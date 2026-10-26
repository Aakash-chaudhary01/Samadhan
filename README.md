# SAMADHAN (समाधान): Smart Civic Issue Reporting & Resolving Platform

**SAMADHAN** is a production-ready, full-stack smart civic platform designed for urban citizen empowerment and transparent municipal issue remediation. Built with a modern, high-performance architecture, it bridges the gap between residents and city administration through geo-tagged reporting, real-time workflow tracking, and proof-of-work verification.

---

## 🏛️ System Architecture

- **Client (`client/`)**: React 18, Vite, Tailwind CSS, Lucide React, Leaflet & React-Leaflet GIS mapping, Recharts analytics, Canvas Confetti.
- **Server API (`server/`)**: Node.js & Express, MongoDB & Mongoose (with embedded in-memory database fallback for instant zero-dependency execution), JWT authentication, bcrypt, Multer proof-upload, Helmet security, Express Rate Limiter.
- **AI Microservice (`ai-service/`)**: FastAPI Python service providing issue classification, geospatial duplicate detection, priority & department routing heuristics, and a bilingual (Hindi & English) civic assistant.
- **Automated Tests (`tests/`)**: Comprehensive test suite covering authentication, RBAC, complaint lifecycle, duplicate detection, points awards, and analytics.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Git

---

### Setup for Windows (PowerShell)

```powershell
# 1. Clone or navigate to the repository
cd C:\path\to\samdhan

# 2. Setup Server
cd server
npm install
# Seed fictional demo dataset (16+ complaints and all roles)
npm run seed
# Start Express server (runs on http://localhost:5001)
npm start

# 3. Setup Python AI Microservice (in a new PowerShell window)
cd ..\ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload

# 4. Setup Frontend Client (in a new PowerShell window)
cd ..\client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

### Setup for macOS / Linux

```bash
# 1. Install dependencies & run tests
npm install
npm test

# 2. Seed database
npm run seed

# 3. Start AI Microservice (Terminal 1)
npm run ai

# 4. Start Server (Terminal 2)
npm run server

# 5. Start Client (Terminal 3)
npm run client
```

*Open your browser at `http://127.0.0.1:5173/`.*

---

## 🔑 Fictional Demo Credentials

The platform is pre-seeded with 4 test accounts covering all user roles:

| Role | Email Address | Password | Description / Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `ramesh.citizen@example.com` | `Citizen123` | Report civic issues, GPS pin, track timeline, rate resolution (+10 pts), earn badges |
| **Municipal Admin** | `admin.pooja@delhimunicipal.gov.in` | `Admin123` | System overview, real analytics charts, review queue, assign staff, audit logs, issue invitations |
| **Supervisor** | `supervisor.vikram@delhimunicipal.gov.in` | `Supervisor123` | Department oversight, workload distribution, quality review |
| **Field Worker** | `worker.karan@delhimunicipal.gov.in` | `Worker123` | View assigned tasks, mark in-progress, upload mandatory proof photo to resolve |

### Staff Invitation Code
Staff accounts can only be created via admin invitation:
- **Active Demo Code**: `SAM-INV-FW-DEMO2026` (Role: `field_worker`, Dept: `Sanitation & Solid Waste`)

---

## ☁️ Database & Cloud Storage Setup

### 1. MongoDB Atlas Configuration (Optional)
By default, SAMADHAN automatically spins up an embedded in-memory MongoDB instance if no local database is running. To connect to MongoDB Atlas:
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/samadhan?retryWrites=true&w=majority`
3. Set in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/samadhan?retryWrites=true&w=majority
   ```

### 2. Cloudinary Configuration (Optional)
By default, evidence photos and complaint uploads are stored on local disk in `server/uploads/` and served statically. To enable Cloudinary:
1. Register at [Cloudinary](https://cloudinary.com/).
2. Copy your Cloud Name, API Key, and Secret to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## 🏆 Civic Recognition & Gamification Engine

Samadhan encourages citizen participation through non-monetary recognition tokens:
- **+20 Points**: Filing a verified civic complaint with geo-coordinates.
- **+10 Points**: Rating the resolution quality with feedback.
- **+30 Points**: Admin-verified community impact on remediation.
- **Double-Award Protection**: Built-in backend safeguards prevent duplicate claims for the same issue.

*Disclaimer: Tokens and certificates represent Samadhan platform recognition and do not constitute government monetary benefits.*

---

## 🧪 Automated Testing

Execute the test suites covering Auth, RBAC, Workflow Lifecycles, and Real Analytics:

```bash
npm test
```

### Verified Test Cases:
1. Database connection & in-memory fallback initialization.
2. Bcrypt password hashing & citizen role enforcement.
3. Role escalation prevention: Staff signup blocked without invitation code.
4. Invitation redemption by field worker.
5. Unique Tracking ID generation (`SAM-YYYYMMDD-XXXX`).
6. +20 Points award with double-claim prevention.
7. Geospatial proximity duplicate detection (200m radius threshold).
8. Strict RBAC: Citizen cannot alter status.
9. Field worker mandatory photo evidence rule before marking `resolved`.
10. Admin verification +30 points impact award.
11. Feedback rating +10 points award.
12. Strict ownership enforcement: Citizens cannot read or modify other users' reports.
13. Live MongoDB statistics aggregation accuracy.

---

## 📄 License
This project is open-source under the MIT License.
