const express = require("express");

const { userAuth } = require("../middlewares/auth");

const { getChat } = require("../controllers/chatController");

const chatRouter = express.Router();

chatRouter.get("/:targetUserId", userAuth, getChat);

module.exports = chatRouter;
