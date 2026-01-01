import { Router, Request, Response } from "express";
import {
  createUser,
  findUserByEmail,
  findUserByResetToken,
  verifyPassword,
  updateUserPassword,
  setResetToken,
  toSafeUser,
} from "../models/user.model";
import {
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
} from "../models/token.model";
import {
  generateTokens,
  generateAccessToken,
  verifyRefreshToken,
  generateResetToken,
  getResetTokenExpiry,
} from "../config/jwt";
import { validate } from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const router = Router();

// POST /api/v1/auth/register
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Create user
      const user = await createUser(email, password, name);

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store refresh token
      storeRefreshToken(user.id, refreshToken, expiresAt);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: toSafeUser(user),
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Registration failed",
      });
    }
  }
);

// POST /api/v1/auth/login
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store refresh token
      storeRefreshToken(user.id, refreshToken, expiresAt);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: toSafeUser(user),
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Login failed",
      });
    }
  }
);

// POST /api/v1/auth/logout
router.post(
  "/logout",
  validate(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Delete refresh token
      deleteRefreshToken(refreshToken);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  }
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Find refresh token in database
      const storedToken = findRefreshToken(refreshToken);
      if (!storedToken) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        deleteRefreshToken(refreshToken);
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          accessToken,
        },
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return res.status(500).json({
        success: false,
        message: "Token refresh failed",
      });
    }
  }
);

// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = findUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If the email exists, a password reset link has been sent",
        });
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const resetTokenExpires = getResetTokenExpiry();

      // Store reset token
      setResetToken(user.id, resetToken, resetTokenExpires);

      // TODO: Send email with reset link
      // In development, log the token
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
        // Only include token in development for testing
        ...(process.env.NODE_ENV === "development" && { resetToken }),
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process request",
      });
    }
  }
);

// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      // Find user by reset token
      const user = findUserByResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      // Update password
      await updateUserPassword(user.id, newPassword);

      return res.status(200).json({
        success: true,
        message: "Password reset successful",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({
        success: false,
        message: "Password reset failed",
      });
    }
  }
);

export default router;
