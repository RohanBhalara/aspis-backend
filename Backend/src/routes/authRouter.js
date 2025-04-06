import express from 'express';
import { authController, authRateLimiter } from '../controllers/auth.js';

export function authRouter() {
    const router = express.Router();
    router.post('/login', authRateLimiter, authController.login);
    router.post('/register', authRateLimiter, authController.register);
    return router;
}