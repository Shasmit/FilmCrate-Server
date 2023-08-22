const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const userController = require('../controllers/user-controller');
const { verifyUser } = require('../middlewares/auth');
const upload = require('../middlewares/uploads');

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

// Get user profile
router.get("/", verifyUser, userController.getUserProfile);

// Upload image
router.post("/uploadImage", verifyUser, upload, userController.uploadImage);

// Update user profile
router.put("/edit-profile", verifyUser, userController.updateUserProfile);

// Update password
router.put("/change-password", verifyUser, userController.updatePassword);

// // Update user profile
// router.put("/:user_id", verifyUser, userController.updateUserProfile);


module.exports = router;
