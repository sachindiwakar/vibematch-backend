const { prisma } = require("../config/database");
const { sendEmail } = require("../services/sendEmail");

// Send Connection Request
const sendConnectionRequest = async (req, res) => {
  try {
    const fromUserId = req.user.id;

    const { toUserId, status } = req.params;

    // Validate Status
    const allowedStatus = ["ignored", "interested"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: `Invalid status type: ${status}`,
      });
    }

    // Prevent Self Request
    if (toUserId === fromUserId) {
      return res.status(400).json({
        message: "You cannot send request to yourself",
      });
    }

    // Find Receiver
    const toUser = await prisma.user.findUnique({
      where: {
        id: toUserId,
      },
    });

    if (!toUser) {
      return res.status(404).json({
        message: "User does not exist",
      });
    }

    // Existing Request Check
    const existingConnectionRequest = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          {
            fromUserId,
            toUserId,
          },
          {
            fromUserId: toUserId,
            toUserId: fromUserId,
          },
        ],
      },
    });

    if (existingConnectionRequest) {
      return res.status(400).json({
        message: "Connection request already exists",
      });
    }

    // Create Request
    const connectionRequest = await prisma.connectionRequest.create({
      data: {
        fromUserId,
        toUserId,
        status,
      },
    });

    // Send Email
    if (status === "interested") {
      await sendEmail(
        toUser.email,
        "New Connection Request 💕",
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          
          <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <h2 style="color: #111827; text-align: center;">
              💕 New Connection on VibeMatch
            </h2>

            <p style="font-size: 16px; color: #374151;">
            Hi <strong>${toUser.firstName}</strong>,
            </p>

            <p style="font-size: 16px; color: #374151;">
              <strong>${req.user.firstName}</strong> 
              just showed interest in connecting with you on 
              <strong>VibeMatch</strong>.
            </p>

            <p style="font-size: 15px; color: #6b7280;">
              Check out their profile and respond to the request.
            </p>

            <div style="text-align: center; margin: 20px 0;">
              <a 
                href="${process.env.CLIENT_URL}/requests"
                style="
                  background-color: #f43f5e;
                  color: white;
                  padding: 10px 18px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: bold;
                "
              >
                View Request
              </a>
            </div>

          </div>

        </div>
        `,
      );
    }

    // Success Message
    const actionText =
      status === "interested" ? "is interested in" : `has ${status}`;

    return res.status(201).json({
      message: `${req.user.firstName} ${actionText} ${toUser.firstName}`,

      data: connectionRequest,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// Review Connection Request
const reviewConnectionRequest = async (req, res) => {
  try {
    const loggedInUser = req.user;

    const { status, requestId } = req.params;

    // Validate Status
    const allowedStatus = ["accepted", "rejected"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: `Invalid status type: ${status}`,
      });
    }

    // Find Connection Request
    const connectionRequest = await prisma.connectionRequest.findFirst({
      where: {
        id: requestId,

        toUserId: loggedInUser.id,

        status: "interested",
      },
    });

    // Request Not Found
    if (!connectionRequest) {
      return res.status(404).json({
        message: "Connection request not found",
      });
    }

    // Update Request
    const updatedRequest = await prisma.connectionRequest.update({
      where: {
        id: requestId,
      },

      data: {
        status,
      },
    });

    // Send Email
    if (status === "accepted") {
      const fromUser = await prisma.user.findUnique({
        where: {
          id: connectionRequest.fromUserId,
        },
      });

      await sendEmail(
        fromUser.email,
        "Request Accepted 🎉",
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          
          <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <h2 style="color: #111827; text-align: center;">
              Hurray!! 😍🎉
            </h2>

           <p style="font-size: 16px; color: #374151;">
           Hi <strong>${fromUser.firstName}</strong>,
           </p>

            <p style="font-size: 16px; color: #374151;">
              <strong>${loggedInUser.firstName}</strong> 
              has accepted your connection request on 
              <strong>VibeMatch</strong>.
            </p>

          <p style="font-size: 15px; color: #6b7280; line-height: 1.7;">
          🎉 Your connection request has officially turned into a match!
          </p>

          <p style="font-size: 15px; color: #6b7280; line-height: 1.7;">
          💬 You both can now start chatting, sharing vibes, and discovering where this connection leads.
          </p>

         <p style="font-size: 15px; color: #6b7280; line-height: 1.7;">
         ✨ Wishing you both meaningful conversations, great vibes, and something truly beautiful ahead 💖😉
        </p>

            <div style="text-align: center; margin: 20px 0;">
              <a 
                href="${process.env.CLIENT_URL}/connections"
                style="
                  background-color: #10b981;
                  color: white;
                  padding: 10px 18px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: bold;
                "
              >
                View Connections
              </a>
            </div>

            <p style="font-size: 13px; color: #9ca3af; text-align: center;">
              You're receiving this because you have an active VibeMatch account.
            </p>

          </div>

        </div>
        `,
      );
    }

    // Create Chat Automatically
    if (status === "accepted") {
      const existingChat = await prisma.chatParticipant.findFirst({
        where: {
          userId: loggedInUser.id,
        },

        include: {
          chat: {
            include: {
              participants: true,
            },
          },
        },
      });

      if (!existingChat) {
        await prisma.chat.create({
          data: {
            participants: {
              create: [
                {
                  userId: loggedInUser.id,
                },
                {
                  userId: connectionRequest.fromUserId,
                },
              ],
            },
          },
        });
      }
    }

    return res.status(200).json({
      message: `Connection request ${status}`,

      data: updatedRequest,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  reviewConnectionRequest,
  sendConnectionRequest,
};
