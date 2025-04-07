import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { authController } from './src/controllers/auth.js';
import { threatsController } from './src/controllers/threats.js';
import { authRouter } from './src/routes/authRouter.js';
import { threatRouter } from './src/routes/threatRouter.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('MongoDB connection error:', err));
}

const authRoutes = authRouter();
const threatRoutes = threatRouter();

// Setup routes
app.get('/', (req, res) => res.send("Running on 3000"));
app.use('/api', authRoutes);
app.use('/api', threatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));