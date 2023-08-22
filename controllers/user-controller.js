const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const registerUser = (req, res, next) => {
  const { username, password, email, confirmPassword } = req.body;
  User.findOne({ $or: [{ username }, { email }] })
    .then((user) => {
      if (user) {
        return res.status(400).json({ error: "Duplicate username or email" });
      }
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        const newUser = new User({
          username,
          password: hash,
          email,
          confirmPassword: hash,
        });
        newUser
          .save()
          .then((user) => {
            res.status(201).json(user);
          })
          .catch(next);
      });
    })
    .catch(next);
};

const loginUser = (req, res, next) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!isMatch) {
          return res.status(400).json({ error: "Invalid password" });
        }
        const payload = {
          id: user._id,
          username: user.username,
          email: user.email,
        };
        jwt.sign(
          payload,
          process.env.SECRET,
          { expiresIn: "1d" },
          (err, token) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ status: "success", token: token });
          }
        );
      });
    })
    .catch(next);
};

const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the user is logged in and get the logged-in user ID
    const loggedInUserID = req.user ? req.user.id : null;

    // Add the isUserLoggedIn field to the user object
    const userWithLoggedInField = {
      ...user.toObject(),
      isUserLoggedIn: loggedInUserID === user._id.toString(),
    };

    res.json({ user: [userWithLoggedInField] });


    // res.json({user : [user]});
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the current password with the stored hashed password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    // Check if the new password is different from the current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from the current password",
      });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;

    // Save the updated user
    await user.save();

    res.status(204).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

const uploadImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a file" });
  }

  // Update the user's profile picture in the database
  const userId = req.user.id;
  const image = req.file.filename;

  User.findByIdAndUpdate(userId, { image })
    .then(() => {
      res.status(200).json({
        success: true,
        data: image,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to update the user's profile picture",
      });
    });
};

const updateUserProfile = async (req, res, next) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the fields only if they are different from the existing values
    if (username && username !== "" && username !== user.username) {
      const existingUserWithUsername = await User.findOne({
        username: username,
      });
      if (existingUserWithUsername) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      user.username = username;
    }
    if (email && email !== "" && email !== user.email) {
      const existingUserWithEmail = await User.findOne({ email: email });
      if (existingUserWithEmail) {
        return res.status(400).json({ error: "Email is already taken" });
      }
      user.email = email;
    }

    // Save the updated user
    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updatePassword,
  uploadImage,
  updateUserProfile,
};
