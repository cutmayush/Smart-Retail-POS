import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Store from '../models/Store.js';
import sendPasswordResetEmail from '../utils/sendPasswordResetEmail.js';
import { ensureTransactionSupport } from '../utils/ensureTransactionSupport.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @desc    Register a store and its Admin owner
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, passwordConfirm, storeName } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const ownerName = typeof name === 'string' ? name.trim() : '';
  const businessName = typeof storeName === 'string' ? storeName.trim() : '';

  if (!ownerName || !businessName || !normalizedEmail || !password || !passwordConfirm) {
    res.status(400);
    throw new Error('Owner name, store name, email, password and password confirmation are required');
  }
  if (ownerName.length > 120 || businessName.length > 120) {
    res.status(400);
    throw new Error('Owner and store names must be 120 characters or fewer');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400);
    throw new Error('Enter a valid email address');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    res.status(400);
    throw new Error('Password must be between 8 and 128 characters');
  }
  if (password !== passwordConfirm) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  await ensureTransactionSupport();
  const session = await mongoose.startSession();
  try {
    let store;
    let user;
    await session.withTransaction(async () => {
      [store] = await Store.create([{ name: businessName }], { session });
      [user] = await User.create(
        [{
          name: ownerName,
          email: normalizedEmail,
          password,
          role: 'Admin',
          tenant: store._id,
          store: businessName,
        }],
        { session },
      );
      store.owner = user._id;
      await store.save({ session });
    });

    res.status(201).json({
      success: true,
      user: user.toSafeObject(),
      token: generateToken(user._id),
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || typeof password !== 'string' || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({
    success: true,
    user: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Request a password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: normalizedEmail });

  // Always return the same generic response whether or not the account exists,
  // so this endpoint can't be used to discover which emails are registered.
  const genericResponse = {
    success: true,
    message: 'If an account exists for this email, reset instructions have been sent.',
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const emailConfigured = process.env.RESEND_API_KEY && process.env.EMAIL_FROM;
  if (emailConfigured) {
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      console.error(`Password reset email delivery failed: ${error.message}`);
      res.status(502);
      throw new Error('Could not send password reset email. Please try again later.');
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`[password reset] token for ${user.email}: ${resetToken} (valid 15 minutes)`);
  }

  res.status(200).json({
    ...genericResponse,
    devResetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
  });
});

// @desc    Reset password using a valid token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.body;

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
    res.status(400);
    throw new Error('Email, reset token and new password are required');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or has expired');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully — please log in' });
});