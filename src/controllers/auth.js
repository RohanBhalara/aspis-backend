import User from "../models/User.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import rateLimit from 'express-rate-limit';
import { JWT_SECRET } from "../middleware/authenticateToken.js";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: 'Too many attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'rate_limit_exceeded',
            message: 'Account temporarily locked due to too many attempts',
            retryAfter: '15 minutes',
        });
    },
});

export const authController = {
    login: async (req, res) => {
        try {
            // Sanitize and validate
            const email = validator.normalizeEmail(validator.trim(req.body.email));
            const password = validator.trim(req.body.password);

            if (!validator.isEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            if (!validator.isLength(password, { min: 8 })) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' });
            }

            // Find user
            const user = await User.findOne({ email: validator.escape(email) });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' }); // Generic message
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate secure token
            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.role // Optional: Add role if using RBAC
                },
                JWT_SECRET,
                {
                    expiresIn: '1h',
                    issuer: 'your-app-name'
                }
            );

            // Secure cookie option (if using cookies)
            res.json({
                token,
                userId: user._id
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Authentication failed' });
        }
    },

    register: async (req, res) => {
        try {
            // Sanitize and validate
            const email = validator.normalizeEmail(validator.trim(req.body.email));
            const password = validator.trim(req.body.password);

            if (!validator.isEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            if (!validator.isStrongPassword(password, {
                minLength: 8,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 0
            })) {
                return res.status(400).json({
                    message: 'Password must be 8+ chars with 1 uppercase and 1 number'
                });
            }

            // Check existing user
            const userExist = await User.findOne({ email: validator.escape(email) });
            if (userExist) {
                return res.status(409).json({ message: 'Email already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user
            const user = await User.create({
                email: validator.escape(email),
                password: hashedPassword
            });

            // Generate token
            const token = jwt.sign(
                { userId: user._id },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(201).json({
                token,
                userId: user._id
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Registration failed' });
        }
    }
};