const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// Get all notifications for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return res.json({ success: true, unreadCount, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

// Mark single notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    return res.json({ success: true, notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating notification' });
  }
});

// Mark all as read
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating notifications' });
  }
});

module.exports = router;
