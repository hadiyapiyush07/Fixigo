# Fixigo - Home Service Booking Platform

Welcome to **Fixigo**, a complete Urban Company-style platform for home services.

This repository contains the full stack for the Fixigo platform, split into three main parts:

## 📁 Repository Structure

*   **[`/SeviceBook_Frontend`](./SeviceBook_Frontend/)**: The React Native mobile application for both Customers and Service Providers.
*   **[`/backend`](./backend/)**: The Node.js, Express, and MongoDB backend API powering the platform.
*   **[`/Admin_Portal`](./Admin_Portal/)**: The web-based admin dashboard to manage users, providers, bookings, and categories.

## 🚀 Tech Stack
*   **Frontend**: React Native, React Navigation, Redux Toolkit
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose)
*   **Real-time & Notifications**: Socket.io, Firebase Cloud Messaging (FCM)
*   **Storage**: Cloudinary (Images), Redis (Caching)

## 🛠️ Getting Started

To run this project locally, please refer to the specific instructions inside each folder.

1.  **Backend**: Navigate to `/backend`, run `npm install`, setup your `.env` file, and start the server with `npm run dev`.
2.  **App**: Navigate to `/SeviceBook_Frontend`, run `npm install`, and start the metro bundler with `npx react-native start`.
