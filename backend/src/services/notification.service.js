const admin = require("firebase-admin");
const Notification = require("../models/Notification.model");

// Send push notification with MongoDB fallback
const sendNotification = async ({ userId, fcmToken, title, body, type, data = {} }) => {
  // Always log in MongoDB as a fallback / permanent record
  const notification = await Notification.create({
    receiver: userId,
    title,
    message: body,
    type,
    data,
  });

  const { emitToUser } = require("../socket/socket");
  emitToUser(userId, 'notification:new', notification);

  if (!fcmToken) {
    console.log(`[Notification] No FCM token for user ${userId}. Saved to DB only. Title: "${title}"`);
    return notification;
  }

  try {
    const payload = {
      notification: { title, body },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK", // for Flutter/RN handling
      },
      token: fcmToken,
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
    };

    const response = await admin.messaging().send(payload);
    console.log(`[Notification] FCM sent to ${userId}: ${response}`);
  } catch (error) {
    console.error(`[Notification] FCM failed for ${userId}:`, error.message);
  }

  return notification;
};

module.exports = {
  sendNotification,
};
