import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from './auth.js';

// ===== Custom Error Classes =====

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  public fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super('Validation failed', 400);
    this.fields = fields;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ===== Async Handler =====

type AsyncHandlerFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export function asyncHandler(fn: AsyncHandlerFn) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ===== Auth Middleware =====

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;
  next();
}

// ===== Admin Middleware =====

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.userId;

  const { User } = await import('../models/index.js');
  const user = await User.findById(decoded.userId).select('role').lean().exec();

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.userRole = user.role;
  next();
}

// ===== Validation Helpers =====

export function requireFields(body: any, fields: string[]): string | null {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)) {
      return `${field} is required`;
    }
  }
  return null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ===== Centralized Error Handler Middleware =====

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(err.errors)) {
      fields[key] = err.errors[key].message;
    }
    return res.status(400).json({
      error: 'Validation failed',
      fields,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000 || err.code === 11001) {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0] || 'field';
    return res.status(409).json({
      error: `Duplicate value for ${field}`,
      details: `${field} already exists`,
    });
  }

  // Our custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err instanceof ValidationError ? { fields: err.fields } : {}),
    });
  }

  // Unknown / unhandled errors
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
  });
}

