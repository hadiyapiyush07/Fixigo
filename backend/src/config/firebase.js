const admin = require("firebase-admin");

const initFirebase = () => {
  if (admin.apps.length > 0) return; // already initialised

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type:                        "service_account",
        project_id:                  process.env.FIREBASE_PROJECT_ID,
        private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
        // .env stores \n as literal text — replace converts to real newlines
        private_key:                 process.env.FIREBASE_PRIVATE_KEY
                                       ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
                                       : undefined,
        client_email:                process.env.FIREBASE_CLIENT_EMAIL,
        client_id:                   process.env.FIREBASE_CLIENT_ID,
        auth_uri:                    "https://accounts.google.com/o/oauth2/auth",
        token_uri:                   "https://oauth2.googleapis.com/token",
      }),
    });
    console.log("✅ Firebase Admin initialised");
  } catch (error) {
    console.error(`❌ Firebase init failed: ${error.message}`);
  }
};

// Send push to one device
// fcmToken is stored in User model and updated every time app opens
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  if (!admin.apps.length) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      // data values must all be strings
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { 
        priority: "high",
        notification: {
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default"
          }
        }
      }
    });
  } catch (error) {
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      console.warn(`⚠️  Stale FCM token: ${fcmToken} — should be removed from DB`);
    } else {
      console.error(`❌ Push failed: ${error.message}`);
    }
  }
};

// Send push to multiple devices
const sendMulticast = async (tokens, title, body, data = {}) => {
  if (!tokens || !tokens.length) return;
  if (!admin.apps.length) return;

  try {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { 
        notification: {
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default"
          }
        }
      }
    });
  } catch (error) {
    console.error(`❌ Multicast push failed: ${error.message}`);
  }
};

module.exports = { initFirebase, sendPushNotification, sendMulticast };
