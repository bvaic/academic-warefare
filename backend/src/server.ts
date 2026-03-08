import express, { response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import path from 'path';

// Initialize environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://127.0.0.1:5173' // vite
    }
});

// Middleware
app.use(cors()); // Allows your Vite frontend to talk to this API
app.use(express.json()); // Allows the server to parse JSON request bodies
app.use(express.static(path.join(import.meta.dirname, '../../frontend/dist')));

// --- REDIS SETUP ---
const redisClient = createClient({
    url: process.env.REDIS_URL!
});
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// --- INITIALIZE CONNECTIONS ---
async function connectInfrastructure() {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ Connected to MongoDB successfully.');

        // 2. Connect to Redis
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully.');

        // 3. Test Ollama Connection
        // We ping the /api/tags endpoint just to verify the service is awake and reachable
        const ollamaRes = await fetch(`${process.env.OLLAMA_HOST}/api/tags`);
        if (ollamaRes.ok) {
            console.log('✅ Connected to Ollama successfully.');
        } else {
            console.warn('⚠️ Ollama responded, but with an unexpected status.');
        }

    } catch (error) {
        console.error('❌ Failed to connect to infrastructure via VPN:', error);
    }
}

// --- ROUTES ---

// A basic health-check route to verify everything from the browser
app.get('/status', (req, res) => {
    res.json({
        message: 'Academic Warfare API is online!',
        databaseStatus: {
            mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient.isReady ? 'connected' : 'disconnected',
            ollamaTarget: process.env.OLLAMA_HOST
        }
    });
});

// serving the react build
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(import.meta.dirname, '../../frontend/dist/index.html'));
});

// --- START SERVER ---
/*
app.listen('0.0.0.0', async (port) => {
    console.log(`Server listening on port ${port}`);
    // Boot up the infrastructure connections right after the server starts listening
    await connectInfrastructure();
});
*/

// ---- SOCKET IO ----
io.on('connect', (socket) => {
    console.log(`Connection from ${socket.id}`);
    
    // add listeners here...

    socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} disconnected for ${reason}`);  
    });
});

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});