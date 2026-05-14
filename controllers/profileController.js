const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { userAuth } = require("../middlewares/auth");
const { sendEmail } = require("../services/sendEmail");
const { getSafeUser } = require("../utils/getSafeUser");
const { prisma } = require("../config/database");
const { validateEditProfileData } = require("../utils/validation");

// Show Profile
const viewProfile = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      data: getSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// Edit Profile
const editProfile = async (req, res) => {
  try {
    // Validate Data
    validateEditProfileData.parse(req.body);

    const loggedInUser = req.user;

    // Update User
    const updatedUser = await prisma.user.update({
      where: {
        id: loggedInUser.id,
      },

      data: req.body,
    });

    return res.status(200).json({
      message: `${updatedUser.firstName}, your profile updated successfully!`,

      data: getSafeUser(updatedUser),
    });
  } catch (err) {
    return res.status(400).json({
      message: err?.issues?.[0]?.message || err.message,
    });
  }
};

// Request Delete Account
const requestDeleteAccount = async (req, res) => {
  try {
    const user = req.user;

    // Generate Delete Token
    const deleteToken = crypto.randomBytes(32).toString("hex");

    // Expiry
    const deleteTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save Token
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        deleteToken,
        deleteTokenExpiry,
      },
    });

    // Verification Link
    const link = `${process.env.CLIENT_URL}/profile/verify/delete-account?token=${deleteToken}`;

    // Send Email
    await sendEmail(
      user.email,
      "Confirm Account Deletion ⚠️",
      `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding: 30px;">
        
        <div style="max-width:500px; margin:auto; background:white; border-radius:10px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <h2 style="text-align:center; color:#ff4d4f; margin-bottom:10px;">
            VibeMatch ⚠️
          </h2>

          <h3 style="text-align:center; margin-top:0;">
            Confirm Account Deletion
          </h3>

          <p style="font-size:15px; color:#555;">
            Hi <strong>${user.firstName}</strong>,
          </p>

          <p style="font-size:14px; color:#555;">
            We received a request to permanently delete your VibeMatch account.
          </p>

          <p style="font-size:14px; color:#555;">
            This action is irreversible and all your data, chats, and connections will be permanently removed.
          </p>

          <div style="text-align:center; margin:25px 0;">
            <a 
              href="${link}" 
              style="
                background:#ff4d4f;
                color:white;
                padding:12px 22px;
                text-decoration:none;
                border-radius:6px;
                font-weight:bold;
                display:inline-block;
              "
            >
              Delete My Account
            </a>
          </div>

          <p style="font-size:13px; color:#777;">
            This link will expire in 10 minutes.
          </p>

          <p style="font-size:13px; color:#777;">
            If you did not request this, you can safely ignore this email.
          </p>

          <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />

          <p style="font-size:12px; color:#aaa; text-align:center;">
            © ${new Date().getFullYear()} VibeMatch. All rights reserved.
          </p>

        </div>
      </div>
      `,
    );

    return res.status(200).json({
      message: "Delete confirmation email sent.",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// Verify Delete Account
const verifyDeleteAccount = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Token is required",
      });
    }

    // Find User
    const user = await prisma.user.findFirst({
      where: {
        deleteToken: token,
      },
    });

    // Invalid Token
    if (!user) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    // Expired Token
    if (user.deleteTokenExpiry < new Date()) {
      return res.status(400).json({
        message: "Token expired",
      });
    }

    // Delete User
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    // Clear Cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // Send Email
    await sendEmail(
      user.email,
      "Your VibeMatch Account Has Been Deleted 💔",
      `
      <div style="font-family: Arial, sans-serif; padding: 30px; background-color: #f4f6f8;">
        
        <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          
          <h2 style="color: #ff4d4f; text-align: center;">
            Account Deleted 😔
          </h2>

          <p style="font-size: 16px; color: #374151;">
            Hi <strong>${user.firstName}</strong>,
          </p>

          <p style="font-size: 15px; color: #555;">
            Your <strong>VibeMatch</strong> account has been permanently deleted successfully.
          </p>

          <p style="font-size: 15px; color: #6b7280;">
            We're sorry to see you go 💔. 
            If you ever decide to come back, 
            you'll always be welcome.
          </p>

          <div style="text-align: center; margin: 25px 0;">
            <a 
              href="${process.env.CLIENT_URL}" 
              style="
                background-color: #4CAF50;
                color: white;
                padding: 12px 22px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: bold;
                display:inline-block;
              "
            >
              Visit VibeMatch
            </a>
          </div>

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            This action is permanent and cannot be undone.
          </p>

        </div>

      </div>
      `,
    );

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  viewProfile,
  editProfile,
  requestDeleteAccount,
  verifyDeleteAccount,
};
