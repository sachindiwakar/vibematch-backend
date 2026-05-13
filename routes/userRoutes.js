const express = require("express");

const { userAuth } = require("../middlewares/auth");

const {
  getReceivedRequests,
  getConnections,
  getUserFeed,
} = require("../controllers/userController");

const userRouter = express.Router();

userRouter.get("/requests/received", userAuth, getReceivedRequests);
userRouter.get("/connections", userAuth, getConnections);
userRouter.get("/feed", userAuth, getUserFeed);

module.exports = userRouter;
