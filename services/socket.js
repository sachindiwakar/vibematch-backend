const socketIO = require("socket.io");

const { prisma } = require("../config/database");

const { generateChatKey } = require("../utils/chat");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const { userId } = socket.handshake.auth || {};

    // Invalid User
    if (!userId) {
      return socket.disconnect(true);
    }

    // Online Users
    onlineUsers.set(userId, socket.id);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // Join Chat
    socket.on("joinChat", ({ targetUserId }) => {
      if (!targetUserId) return;

      const chatKey = generateChatKey(userId, targetUserId);

      socket.join(chatKey);
    });

    // Send Message
    socket.on("sendMessage", async ({ targetUserId, text }) => {
      try {
        // Validation
        if (!targetUserId || !text || !text.trim()) {
          return socket.emit("errorMessage", {
            message: "Invalid message",
          });
        }

        // Check Connection
        const connection = await prisma.connectionRequest.findFirst({
          where: {
            OR: [
              {
                fromUserId: userId,
                toUserId: targetUserId,
              },
              {
                fromUserId: targetUserId,
                toUserId: userId,
              },
            ],

            status: "accepted",
          },
        });

        // Not Connected
        if (!connection) {
          return socket.emit("errorMessage", {
            message: "Users are not connected",
          });
        }

        // Chat Key
        const chatKey = generateChatKey(userId, targetUserId);

        // Find Chat
        let chat = await prisma.chat.findUnique({
          where: {
            chatKey,
          },
        });

        // Create Chat
        if (!chat) {
          chat = await prisma.chat.create({
            data: {
              chatKey,

              participants: {
                create: [
                  {
                    userId,
                  },
                  {
                    userId: targetUserId,
                  },
                ],
              },
            },
          });
        }

        // Save Message
        const newMessage = await prisma.message.create({
          data: {
            senderId: userId,

            chatId: chat.id,

            text: text.trim(),
          },

          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoUrl: true,
              },
            },
          },
        });

        // Emit Message
        io.to(chatKey).emit("messageReceived", newMessage);
      } catch (err) {
        console.error("Socket Error:", err.message);

        socket.emit("errorMessage", {
          message: "Failed to send message",
        });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = initializeSocket;
