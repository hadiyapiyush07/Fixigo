const express = require('express');
const { 
  updateFCMToken, 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyToken); // All routes require authentication

router.post('/fcm-token', updateFCMToken);
router.get('/', getMyNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
