const { prisma } = require("../config/database");

const { generateChatKey } = require("../utils/chat");

// Get Chat
const getChat = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const { targetUserId } = req.params;

    // Pagination
    const limit = 50;

    const skip = parseInt(req.query.skip) || 0;

    // Chat Key
    const chatKey = generateChatKey(loggedInUserId, targetUserId);

    // Find Chat
    let chat = await prisma.chat.findUnique({
      where: {
        chatKey,
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoUrl: true,
              },
            },
          },
        },
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
                userId: loggedInUserId,
              },
              {
                userId: targetUserId,
              },
            ],
          },
        },

        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      });
    }

    // Messages
    const messages = await prisma.message.findMany({
      where: {
        chatId: chat.id,
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

      orderBy: {
        createdAt: "desc",
      },

      skip,

      take: limit,
    });

    // Total Messages
    const totalMessages = await prisma.message.count({
      where: {
        chatId: chat.id,
      },
    });

    return res.status(200).json({
      participants: chat.participants.map((participant) => participant.user),

      messages: messages.reverse(),

      hasMore: totalMessages > skip + limit,
    });
  } catch (err) {
    console.error("Chat fetch error:", err);

    return res.status(500).json({
      message: "Error fetching chat",
    });
  }
};

module.exports = {
  getChat,
};
