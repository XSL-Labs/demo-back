const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.get('/isAdmin', userController.getMe, userController.isAdmin);

router.use(authController.restrictToAdmin());

router.route('/').get(userController.getAllUsers);

module.exports = router;
