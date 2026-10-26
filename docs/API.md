# SAMADHAN REST API Documentation

Base URL: `http://localhost:5001/api`

---

## 1. Authentication & Staff Invitations (`/api/auth`)

### `POST /api/auth/register`
Register a new citizen or staff account.
- **Request Body**:
  ```json
  {
    "name": "Ramesh Sharma",
    "email": "ramesh@example.com",
    "password": "Password123",
    "role": "citizen", // or "field_worker" / "supervisor" / "municipal_admin"
    "invitationCode": "SAM-INV-FW-XXXX", // Mandatory if role is not citizen
    "ward": "Ward 4"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "...", "role": "citizen", "points": 0 }
  }
  ```

### `POST /api/auth/login`
Authenticate existing user.
- **Request Body**:
  ```json
  {
    "email": "ramesh@example.com",
    "password": "Password123",
    "portal": "citizen" // or "municipal"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "success": true,
    "token": "eyJhbGci...",
    "user": { ... }
  }
  ```

### `POST /api/auth/create-invitation`
*Protected: Municipal Admin only*
Generate a staff invitation code.
- **Request Body**:
  ```json
  {
    "email": "newworker@delhimunicipal.gov.in",
    "role": "field_worker",
    "department": "Sanitation & Solid Waste",
    "ward": "Ward 2"
  }
  ```

---

## 2. Complaints Management (`/api/complaints`)

### `POST /api/complaints`
*Protected: Citizen*
Submit a geo-tagged complaint. Awards +20 platform points.
- **Request Body**:
  ```json
  {
    "title": "Open pothole near market entrance",
    "description": "2-foot wide pothole causing two-wheeler skids",
    "category": "Potholes & Road Damage",
    "priority": "high",
    "photoUrl": "http://localhost:5001/uploads/proof_...",
    "location": {
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "Connaught Place Gate 4",
      "city": "Delhi NCR",
      "ward": "Ward 4"
    }
  }
  ```

### `GET /api/complaints`
*Protected: Filtered by User Role*
- Citizen: Retrieves personal complaints.
- Field Worker: Retrieves assigned tasks.
- Admin / Supervisor: Retrieves system complaints.

### `PATCH /api/complaints/:id/status`
*Protected: RBAC enforced*
- **Allowed Transitions**:
  - `municipal_admin` / `supervisor`: `submitted` -> `assigned`, `assigned` -> `verified`.
  - `field_worker`: `assigned` -> `in_progress`, `in_progress` -> `resolved` (*requires `evidencePhotoUrl`*).
- **Request Body**:
  ```json
  {
    "status": "resolved",
    "evidencePhotoUrl": "http://localhost:5001/uploads/evidence_...",
    "resolutionNotes": "Pothole filled with rapid set asphalt."
  }
  ```

### `POST /api/complaints/:id/feedback`
*Protected: Citizen Owner only*
Rate resolution quality. Awards +10 platform points.
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Repaired quickly and thoroughly."
  }
  ```

---

## 3. Real Telemetry & Statistics (`/api/complaints/public-stats`)

### `GET /api/complaints/public-stats`
*Public*
Returns real MongoDB aggregate metrics:
```json
{
  "success": true,
  "stats": {
    "totalComplaints": 16,
    "resolvedComplaints": 4,
    "inProgressComplaints": 6,
    "resolutionRate": 25
  },
  "categoryBreakdown": [ ... ],
  "wardHotspots": [ ... ]
}
```

---

## 4. AI Microservice & Assistant (`/api/ai`)

### `POST /api/ai/chat`
Bilingual assistant conversation in Hindi and English with automatic fallback.
- **Request Body**:
  ```json
  {
    "message": "How do platform points work?",
    "language": "en"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "serviceStatus": "ai_service_online",
    "reply": "On Samadhan, active citizens earn recognition points: +20 on filing, +10 on resolution feedback, and +30 on verified community impact."
  }
  ```

### `POST /api/ai/classify-image`
Heuristic and computer vision category tag suggestion.
- **Request Body**:
  ```json
  {
    "fileName": "pothole_site.jpg",
    "imageUrl": "http://localhost:5001/uploads/..."
  }
  ```
