import express from 'express';
import { threatsController } from '../controllers/threats.js';
import authenticateToken from '../middleware/authenticateToken.js';

export function threatRouter() {
    const router = express.Router();
    router.get('/threats', authenticateToken, threatsController.getThreats);
    return router;
}