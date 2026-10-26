# MASTER SPECIFICATION: SAMADHAN - Smart Civic Issue Reporting & Resolving Platform

## Overview
SAMADHAN is a full-stack smart civic issue reporting and resolution platform engineered with React (Vite + Tailwind CSS), Node.js (Express + Mongoose), and an AI microservice (FastAPI + Python). It empowers citizens to submit, track, and follow up on localized civic concerns (potholes, garbage, waterlogging, streetlights, sanitation, stray animals, etc.) while giving municipal administrators, supervisors, and field workers dedicated dashboards to review, assign, verify, resolve, and audit complaints.

## Design Reference & Aesthetics
- Hero Section Layout Reference: Exact editorial layout inspired by high-end municipal/editorial portals with top pill navigation, dominant headline "SAMADHAN", prominent red/accent action button, minimal and editorial dark background (no statues/flowers/artwork), and an editorial bottom section featuring:
  - Kicker tag: "CIVIC EMPOWERMENT"
  - Headline: "Enter a world where creatures come alive"
  - Description: "An immersive world of curious creatures, magical places, and stories waiting to be discovered."
  - CTA Buttons: "Explore SAMADHAN →" and "Meet the Creatures →"
  - Responsive feature highlights grid.
- Official Logo: `client/public/images/samadhan-logo.png` used unaltered.
- Intro Animation: LogoIntro with zoom 0.4 to 1, tagline, once per session via `sessionStorage`, respects `prefers-reduced-motion`.

## Architecture
1. **Frontend (`client/`)**: React 18, Vite, Tailwind CSS, Lucide icons, Leaflet & React-Leaflet for geo-mapping, Recharts for analytics, Axios.
2. **Backend API (`server/`)**: Express.js, MongoDB / Mongoose with embedded in-memory fallback for instant zero-dependency execution, JWT authentication, bcrypt, Multer for image upload, Express Rate Limit, Helmet.
3. **AI Service (`ai-service/`)**: FastAPI Python service offering endpoints for image classification, duplicate detection (embedding/similarity heuristic), priority suggestion, department recommendation, and bilingual (Hindi/English) assistant FAQ fallback.
4. **Testing Suite (`tests/`)**: Automated integration and unit tests covering Auth, RBAC, Ownership, Complaints, Status transitions, Duplicate detection, Rewards, and Analytics.

## User Roles & Access Control
- `citizen`: Submit complaints, track status timeline, view personal rewards/badges, give feedback on resolution, converse with civic AI assistant.
- `municipal_admin`: Review queue, department routing, staff invitation & role assignment, system-wide analytics, audit logs.
- `field_worker`: View assigned complaints, update progress, upload proof/evidence photos of resolution.
- `supervisor`: Ward-level oversight, department workload tracking, verification approvals.
*Rule*: Staff accounts can only be created via admin invitation codes or admin provisioned access.

## Core Workflows
1. **Reporting**: Title, description, category, photo preview, GPS / interactive Leaflet pin, ward & city detection, unique complaint ID (e.g. `SAM-YYYYMMDD-XXXX`).
2. **Resolution Pipeline**: `submitted` -> `under_review` -> `assigned` -> `in_progress` -> `resolved` -> `verified` -> `closed` (or `rejected`).
3. **Evidence Verification**: Field workers must provide resolution photo evidence before status can be marked resolved.
4. **Rewards & Gamification**: 20 pts for reporting, 10 pts for valid feedback, 30 pts for verified community impact; double-award protection; badges (Civic Starter, Active Resolver, Ward Guardian). Labeled explicitly as "Samadhan platform recognition" rather than official government entitlement.
5. **Transparency & Honesty**: Real MongoDB metrics only (no fabricated stats). Never claim direct official government authority without disclaimer; provide reference links to official government grievance portals (CPGRAMS, Swachhata, etc.).
