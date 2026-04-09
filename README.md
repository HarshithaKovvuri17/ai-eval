# ⬡ NeuralCert – AI-Based Answer Evaluation System

A full-stack MERN application where students take AI-evaluated exams and earn verifiable PDF certificates.  
Answer evaluation is powered by **Google Gemini 1.5 Flash** — deployable anywhere, no local GPU needed.

---

## 🗂️ Project Structure

```
ai-eval/
├── backend/
│   ├── controllers/       authController, adminController, courseController, testController
│   ├── models/            User, Course, Attempt, Progress, Certificate
│   ├── routes/            auth, admin, courses, test, certificate
│   ├── services/
│   │   ├── geminiService.js      ← Google Gemini AI evaluation  ✦ NEW
│   │   ├── certificateService.js ← PDFKit certificate generation
│   │   └── emailService.js       ← Nodemailer password reset / welcome
│   ├── middleware/        JWT auth + refresh tokens
│   ├── certificates/      Generated PDFs (auto-created)
│   └── server.js
└── frontend/
    └── src/
        ├── pages/auth/     Login, Register, Forgot/Reset Password
        ├── pages/student/  Courses, CourseDetail, TestPage, ResultPage, Dashboard, Certificates
        ├── pages/admin/    Dashboard, Courses, CourseForm, Users
        ├── components/layout/  StudentLayout, AdminLayout
        ├── context/        AuthContext (JWT + Google OAuth)
        └── services/api.js Axios instance with auto-refresh
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key (free at https://aistudio.google.com/app/apikey)
- Google OAuth credentials (for Sign-in with Google)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values (see below)
npm run dev        # http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_GOOGLE_CLIENT_ID
npm start          # http://localhost:3000
```

---

## ⚙️ Environment Variables

### `backend/.env`

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ai_eval   # or local

# JWT (use long random strings)
JWT_SECRET=change_this_to_a_long_random_string_min_32_chars
JWT_REFRESH_SECRET=another_long_random_string_min_32_chars

# Google OAuth (Sign-in with Google)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# ★ Google Gemini AI — get free key at https://aistudio.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=AIza...your_key_here

# Email — Gmail SMTP (use App Password, not your real password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

### `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## 🤖 Google Gemini AI Evaluation

Each submitted answer is evaluated by **Gemini 1.5 Flash** using this flow:

```
Student submits answer
       ↓
Backend sends to Gemini:
  - Question text
  - Admin's model answer
  - Student's answer
       ↓
Gemini returns JSON:
  { "score": 78, "feedback": "Good understanding of core concepts..." }
       ↓
Score stored + shown to student with per-question feedback
```

**Fallback**: If the Gemini API call fails for any reason, a keyword-overlap algorithm scores the answer automatically so the test is never blocked.

### Getting a Gemini API Key (Free)

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key into your `backend/.env` as `GOOGLE_GEMINI_API_KEY`

The free tier supports **1,500 requests/day** at no cost — more than enough for most use cases.

---

## 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID → Web application
4. Authorized JavaScript origins: `http://localhost:3000` (+ your production URL)
5. Copy the Client ID to both `.env` files

---

## 🎓 How the System Works

### Student Flow
```
Register / Sign in with Google
       ↓
Browse courses → Click course → View Round info
       ↓
Start Round 1 → Answer all questions (text answers)
Navigate with Prev / Next / Question grid
       ↓
Submit → Gemini evaluates each answer → Score %
       ↓
≥ 50%? → Unlock Round 2
≥ 70% in Round 2? → PDF Certificate generated
       ↓
Download certificate
```

### Retry Logic
| Situation | Behaviour |
|-----------|-----------|
| Fail Round 1 | Retry (max 3 attempts) |
| Fail Round 2 | Retry (max 3 attempts) |
| All Round 1 retakes used | Course locked → Restart resets both rounds |
| Pass Round 2 | Certificate issued immediately |

### Admin Flow
```
Login as Admin → Dashboard (stats + recent attempts)
       ↓
Create Course → Set title, description, difficulty, duration
       ↓
Add questions for Round 1 and Round 2 (unlimited, any number)
Each question: question text + model answer (hidden from students)
       ↓
Students see questions → AI evaluates their answers vs model answer
```

---

## 📜 Certificate Generation

Certificates are styled PDF files (PDFKit) containing:
- Student's full name
- Course title
- Round 1 and Round 2 percentage scores
- Issue date
- Unique certificate ID
- Verification seal

Download endpoint: `GET /api/certificate/download/:certId`

---

## 🛡️ API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register (student or admin) |
| POST | `/api/auth/login` | ✗ | Email + password login |
| POST | `/api/auth/google` | ✗ | Google OAuth login |
| POST | `/api/auth/forgot-password` | ✗ | Send reset email |
| POST | `/api/auth/reset-password/:token` | ✗ | Set new password |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/auth/logout` | ✓ | Logout |

### Student
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/courses` | All active courses |
| GET | `/api/courses/:id` | Course + progress |
| GET | `/api/courses/:id/questions/:level` | Questions for a round |
| POST | `/api/test/submit` | Submit + AI evaluate |
| GET | `/api/test/progress/:courseId` | Progress for a course |
| GET | `/api/test/history` | All past attempts |
| POST | `/api/test/restart/:courseId` | Reset course |
| GET | `/api/certificate/my` | My certificates |
| GET | `/api/certificate/download/:certId` | Download PDF |

### Admin (requires admin role)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/users` | All students |
| GET/POST | `/api/admin/courses` | List / create |
| GET/PUT/DELETE | `/api/admin/courses/:id` | Manage course |
| POST | `/api/admin/courses/:id/questions` | Add question |
| PUT/DELETE | `/api/admin/courses/:id/questions/:qId` | Edit/delete question |

---

## ☁️ Deployment Notes

### Backend (Render / Railway / Fly.io)
1. Set all environment variables in the platform dashboard
2. `FRONTEND_URL` = your deployed frontend URL
3. `MONGODB_URI` = MongoDB Atlas connection string
4. `GOOGLE_GEMINI_API_KEY` = your key
5. Build command: `npm install` | Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set `REACT_APP_API_URL` = your deployed backend URL + `/api`
2. Set `REACT_APP_GOOGLE_CLIENT_ID`
3. Build command: `npm run build` | Publish dir: `build`
4. Add your production URLs to Google OAuth authorized origins

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| UI | Lucide React, React Hot Toast, Syne + DM Sans fonts |
| Auth | JWT (access + refresh), Google OAuth 2.0 |
| Backend | Node.js 18, Express 4 |
| Database | MongoDB, Mongoose |
| **AI Engine** | **Google Gemini 1.5 Flash** |
| Certificates | PDFKit |
| Email | Nodemailer (Gmail SMTP) |

---

## 📝 License

MIT
