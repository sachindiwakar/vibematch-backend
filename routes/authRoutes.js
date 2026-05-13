const express = require("express");
const authRouter = express.Router();
const {
  signupUser,
  verifyUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

authRouter.post("/signup", signupUser);
authRouter.get("/verify", verifyUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);
authRouter.post("/forgot-password", forgotPassword);
authRouter.patch("/reset-password", resetPassword);

module.exports = authRouter;
