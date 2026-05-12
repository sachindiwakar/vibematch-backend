const express = require("express");
const authRouter = express.Router();
const {
  signupUser,
  verifyUser,
  loginUser,
  logoutUser,
} = require("../controllers/authController");

authRouter.post("/signup", signupUser);
authRouter.get("/verify", verifyUser);
authRouter.post("/login", loginUser);
authRouter.post("/logout", logoutUser);

module.exports = authRouter;
