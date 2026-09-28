const express = require("express");
const router = express.Router();
const {protect} = require('../../middleware/authMiddleware')

const { getUsers, toggleUserStatus } = require('../../controllers/admin/userController');

router.get('/', protect, getUsers);
router.patch('/:userId/status', protect, toggleUserStatus);

module.exports = router;