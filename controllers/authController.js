const { validateSignUpData } = require("../utils/validation");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../services/sendEmail");
const { prisma } = require("../config/database");
const generateToken = require("../utils/jwt");

//User Sign Up
const signupUser = async (req, res) => {
  try {
    // Validate Data
    validateSignUpData.parse(req.body);

    const { firstName, lastName, email, password } = req.body;

    // Check Existing User
    const userExists = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      return res.status(400).json({
        message: "You already have an account.",
      });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create User
    const savedUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: passwordHash,
        verificationToken,
        isVerified: false,
      },
    });

    // Verification Link
    const link = `${process.env.CLIENT_URL}/verify?token=${verificationToken}`;

    // Send Email
    await sendEmail(
      email,
      "Verify Your VibeMatch Account",
      `<div style="font-family: Arial; padding: 20px;">
        <h2>Welcome to VibeMatch 👋</h2>

        <p>Hi ${firstName},</p>

        <p>
          Thanks for signing up! Please verify your email to get started.
        </p>

        <a 
          href="${link}" 
          style="
            display:inline-block;
            padding:10px 20px;
            background:#4CAF50;
            color:white;
            text-decoration:none;
            border-radius:5px;
          "
        >
          Verify Email
        </a>

        <p style="margin-top:20px;font-size:12px;color:gray;">
          If you didn't sign up, you can ignore this email.
        </p>
      </div>`,
    );

    res.status(201).json({
      message: "Signup successful. Check your email.",
      data: savedUser,
    });
  } catch (err) {
    return res.status(400).json({
      message: err?.issues?.[0]?.message || err.message,
    });
  }
};

// Verify Email
const verifyUser = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    // Find User
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    // Invalid Token
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // Already Verified
    if (user.isVerified) {
      return res.json({
        message: "Email already verified",
      });
    }

    // Verify User
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    // Generate JWT
    const jwtToken = generateToken(updatedUser.id);

    // Set Cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

//User Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate Input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find User
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Invalid Email
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Compare Password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Invalid Password
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // Email Verification Check
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email first",
      });
    }

    // Generate JWT
    const token = generateToken(user.id);

    // Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      data: user,
    });
  } catch (err) {
    return res.status(400).json({
      message: err?.issues?.[0]?.message || err.message,
    });
  }
};

//LogOut User
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find User
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Expiry Time
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save Token
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Reset Link
    const link = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send Email
    await sendEmail(
      email,
      "Reset Your VibeMatch Password",
      `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding: 30px;">
        
        <div style="max-width:500px; margin:auto; background:white; border-radius:10px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <h2 style="text-align:center; color:#4CAF50; margin-bottom:10px;">
            VibeMatch 💕🔐
          </h2>

          <h3 style="text-align:center; margin-top:0;">
            Reset Your Password
          </h3>

          <p style="font-size:15px; color:#555;">
            Hi <strong>${user.firstName}</strong>,
          </p>

          <p style="font-size:14px; color:#555;">
            We received a request to reset your password.
          </p>

          <div style="text-align:center; margin:25px 0;">
            <a href="${link}" 
              style="background:#4CAF50; color:white; padding:12px 22px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size:13px; color:#777;">
            This link expires in 15 minutes.
          </p>

        </div>
      </div>
      `,
    );

    return res.status(200).json({
      message: "Reset link sent to email",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Something went wrong",
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate Input
    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    // Find User
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    // Invalid Token
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Password
    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send Confirmation Email
    await sendEmail(
      user.email,
      "Your VibeMatch password was reset successfully",
      `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding: 30px;">
        
        <div style="max-width:500px; margin:auto; background:white; border-radius:10px; padding:25px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          
          <h2 style="text-align:center; color:#4CAF50; margin-bottom:10px;">
            VibeMatch 💕🎉
          </h2>

          <h3 style="text-align:center; margin-top:0;">
            Password Reset Successful
          </h3>

          <p style="font-size:15px; color:#555;">
            Hi <strong>${user.firstName}</strong>,
          </p>

          <p style="font-size:14px; color:#555;">
            Your password has been successfully updated.
          </p>

          <div style="text-align:center; margin:25px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
              style="background:#4CAF50; color:white; padding:12px 22px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
              Visit VibeMatch
            </a>
          </div>

        </div>
      </div>
      `,
    );

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Something went wrong",
    });
  }
};

module.exports = {
  signupUser,
  verifyUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
};
