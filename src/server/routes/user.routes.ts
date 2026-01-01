import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/user.validator';
import {
  findUserById,
  updateUserProfile,
  verifyPassword,
  updateUserPassword,
  deleteUser,
  toSafeUser,
} from '../models/user.model';
import { deleteAllUserRefreshTokens } from '../models/token.model';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: {
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
});

// PUT /api/v1/users/profile
router.put('/profile', validate(updateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { name, avatar } = req.body;

    const updatedUser = updateUserProfile(req.user.userId, { name, avatar });
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: toSafeUser(updatedUser),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// PUT /api/v1/users/change-password
router.put('/change-password', validate(changePasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user
    const user = findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(user, currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    await updateUserPassword(user.id, newPassword);

    // Invalidate all refresh tokens (logout all devices)
    deleteAllUserRefreshTokens(user.id);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
});

// DELETE /api/v1/users/account
router.delete('/account', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Delete all user tokens first
    deleteAllUserRefreshTokens(req.user.userId);

    // Delete user account
    deleteUser(req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

export default router;
