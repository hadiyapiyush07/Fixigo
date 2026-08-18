<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
</div>

<br/>

# 🛠️ Fixigo — On-Demand Home Services Platform

> **A production-oriented, full-stack home service booking platform connecting customers with verified local professionals.**

Fixigo is designed to seamlessly bridge the gap between customers needing home services (like AC repair, plumbing, and electrical work) and skilled providers looking for gig opportunities. It features a complete two-sided marketplace architecture.

---

## ✨ Platform Ecosystem

The platform is designed around three core interfaces:

### 👤 1. Consumer App (React Native)
*   **Authentication:** Secure OTP-based login and registration.
*   **Discovery:** Browse categories, view service options, and check transparent pricing.
*   **Booking Engine:** Create instant bookings with real-time geographic provider assignment.
*   **Live Tracking:** Track provider status (Accepted, On the way, Arrived) and live location.
*   **Security:** OTP-based service start and completion verification.
*   **Post-Service:** Payment processing, invoicing, and rating/review system.

### 🧑‍🔧 2. Provider App (React Native)
*   **Onboarding:** Profile creation and automated e-KYC verification.
*   **Availability:** Toggle status (Online / Offline / Busy).
*   **Job Management:** Receive nearby job requests with a 120-second acceptance window.
*   **Navigation:** In-app routing to the customer's location.
*   **Earnings:** Track daily/weekly payouts and wallet balance.

### 🛡️ 3. Admin Portal (Web)
*   **Oversight:** Dashboard for platform analytics and operational monitoring.
*   **Verification:** Manual override for flagged provider KYC documents.
*   **Management:** Complete control over Users, Providers, Bookings, and Service Categories.

---

## 🔄 The Booking Lifecycle

Fixigo uses a highly controlled, state-based workflow for every booking:

```text
Consumer                     Backend (Node.js)                  Provider
   │                                │                               │
   ├── 1. Books Service ───────────►│                               │
   │                                │── 2. Geospatial Search ──────►│
   │                                │  (3km → 5km → 8km → 20km)     │
   │                                │                               │
   │                                │◄── 3. Accepts Job ────────────┤
   │◄── 4. Push Notification ───────┤                               │
   │                                │                               │
   │                                │◄── 5. Status: "On the way" ───┤
   │◄── 6. Live Location (Socket) ──┤                               │
   │                                │                               │
   ├── 7. Shares Start OTP ────────►│◄── 8. Verifies OTP ───────────┤
   │                                │                               │
   │                                │◄── 9. Status: "Completed" ────┤
   ├── 10. Pays via App/Cash ──────►│                               │
   │                                │                               │
   └── 11. Leaves Review ──────────►│◄── 12. Earnings Updated ──────┘
```

---

## 🏗️ Project Architecture

```text
Fixigo/
├── Admin_Portal/           # React.js web dashboard
├── SeviceBook_Frontend/    # React Native CLI mobile application (Consumer & Provider)
│   ├── android/            # Native Android code
│   ├── ios/                # Native iOS code
│   └── src/                # Shared JS/JSX UI, Redux, and Axios logic
├── backend/                # Node.js REST API
│   ├── controllers/        # Request handling and validation
│   ├── middleware/         # JWT Auth, Rate Limiting, Error catching
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # Express API endpoints
│   └── services/           # Heavy DB logic and geospatial queries
└── README.md
```

---

## 💻 Technology Stack

### Mobile Frontend
*   **Framework:** React Native CLI (v0.85.3)
*   **State Management:** Redux Toolkit & React-Redux
*   **Navigation:** React Navigation v7 (Stack & Bottom Tabs)
*   **Networking:** Axios with global interceptors
*   **Storage:** AsyncStorage for persistent sessions
*   **UI/UX:** React Native Reanimated, Skeleton Placeholders, Lucide Icons

### Backend API
*   **Environment:** Node.js + Express.js
*   **Database:** MongoDB Atlas + Mongoose ODM (utilizing `2dsphere` indexes)
*   **Authentication:** JSON Web Tokens (JWT) & bcryptjs hashing
*   **Security:** Express Rate Limit, Helmet, CORS
*   **File Storage:** Cloudinary + Multer

### Real-Time & Integrations
*   **Push Notifications:** Firebase Cloud Messaging (FCM) via Firebase Admin
*   **WebSockets:** Socket.io for live GPS tracking and instant chat
*   **Payments:** Razorpay (Test Mode)

---

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_cluster_url
JWT_SECRET=your_super_secret_key
FIREBASE_PROJECT_ID=...
CLOUDINARY_CLOUD_NAME=...
```
Run the server:
```bash
npm run dev
```

### 2. Start the Mobile App
```bash
cd SeviceBook_Frontend
npm install
```
*Note: Make sure your `Config.API_URL` or Axios Base URL points to your local machine's IP (e.g., `http://192.168.1.X:5000/api`) if running on a physical device.*

Run the Android app:
```bash
npx react-native run-android
```

---

## 🔐 Security Principles Implemented

*   **No Plaintext Passwords:** All user passwords are cryptographically hashed using `bcryptjs` before hitting the database.
*   **Stateless Auth:** Sessions are managed via short-lived JWTs, ensuring the backend scales easily without memory overhead.
*   **Geospatial Efficiency:** Mongoose `$near` queries are optimized with `2dsphere` indexes to prevent database locking during heavy searches.
*   **Role-Based Access Control (RBAC):** API endpoints strictly verify if a user has `customer`, `provider`, or `admin` privileges before executing controller logic.

---

## 👨‍💻 Author

**Piyush Hadiya**  
GitHub: [@hadiyapiyush07](https://github.com/hadiyapiyush07)

---
*Disclaimer: Fixigo is a portfolio project designed to demonstrate production-ready architectural patterns in React Native and Node.js. It uses development API keys for third-party services.*
