import 'dotenv/config';
import express, { response } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { courseExists, registerUserToCourse, getUserIdByUsername, getCourseIdAndProfessorId } from './db/dbutils.js';
import { ingestSyllabus } from './services/ingestionService.js';
import { generateQuestions } from './services/aiService.js';
import { Question, Professor } from './db/models.js';
import { randomUUID } from 'crypto';

const app = express();
const port = process.env.PORT || 3001;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

interface Player {
    id: string;
    username: string;
    ships: { x: number, y: number }[];
    hitCoordinates: { x: number, y: number }[];
    missCoordinates: { x: number, y: number }[];
}

interface Room {
    code: string;
    players: Player[];
    currentTurn: number; // index in players array
    profId: string;
    profName: string;
    isGenerating?: boolean;
    loadingStatus?: {
        step: string;
        progress: number;
    }
}

const rooms: Map<string, Room> = new Map();

function generateRandomShips() {
    const ships: { x: number, y: number }[] = [];
    const shipSizes = [5, 4, 3, 3, 2];
    const grid: boolean[][] = Array(10).fill(null).map(() => Array(10).fill(false));

    for (const size of shipSizes) {
        let placed = false;
        while (!placed) {
            const horizontal = Math.random() < 0.5;
            const x = Math.floor(Math.random() * (horizontal ? 10 - size : 10));
            const y = Math.floor(Math.random() * (horizontal ? 10 : 10 - size));

            let collision = false;
            for (let i = 0; i < size; i++) {
                if (grid[horizontal ? y : y + i][horizontal ? x + i : x]) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                for (let i = 0; i < size; i++) {
                    const sx = horizontal ? x + i : x;
                    const sy = horizontal ? y : y + i;
                    grid[sy][sx] = true;
                    ships.push({ x: sx, y: sy });
                }
                placed = true;
            }
        }
    }
    return ships;
}

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
        console.log('Connected to MongoDB successfully.');

        // 2. Connect to Redis
        await redisClient.connect();
        console.log('Connected to Redis successfully.');

    } catch (error) {
        console.error('Failed to connect to infrastructure via VPN:', error);
    }
}

connectInfrastructure();

// --- ROUTES ---

// A basic health-check route to verify everything from the browser
app.get('/status', (req, res) => {
    res.json({
        message: 'Academic Warfare API is online!',
        databaseStatus: {
            mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient.isReady ? 'connected' : 'disconnected'
        }
    });
});

// serving the react build
app.use(express.static(path.join(import.meta.dirname, '../../frontend/dist')));

interface RegisterCourseEvent {
    username: string,
    courseName: string,
    profFirstName: string,
    profLastName: string
}

// ---- SOCKET IO ----
io.on('connect', (socket) => {
    console.log(`Connection from ${socket.id}`);
    
    socket.on('joinRoom', async (data: { roomCode: string, username: string, profFirstName: string, profLastName: string, courseName: string }) => {
        const { roomCode, username, profFirstName, profLastName, courseName } = data;
        const cleanFirstName = (profFirstName || '').trim();
        const cleanLastName = (profLastName || '').trim();
        const cleanCourseName = (courseName || '').trim();

        if (roomCode.length !== 4) {
            return socket.emit('error', 'Room code must be exactly 4 characters.');
        }

        console.log(`[joinRoom] User ${username} in room ${roomCode}`);
        let room = rooms.get(roomCode);
        if (!room) {
            console.log(`[joinRoom] Creating new room: ${roomCode}`);
            if (!cleanFirstName || !cleanLastName || !cleanCourseName) {
                return socket.emit('error', 'Please fill in all course information to start a new room.');
            }
            // Find professor or create if needed
            let { professorId } = await getCourseIdAndProfessorId(cleanCourseName, cleanFirstName, cleanLastName);
            
            if (!professorId) {
                console.log(`[joinRoom] Professor not found in DB, creating entry for ${cleanFirstName} ${cleanLastName}`);
                // Try to find by name directly in DB
                const prof = await Professor.findOne({ 
                    first_name: { $regex: new RegExp(`^${cleanFirstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
                    last_name: { $regex: new RegExp(`^${cleanLastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
                });
                if (prof) {
                    professorId = prof._id;
                } else {
                    // Try to find in Nebula to get real data
                    let nebulaProfData = null;
                    try {
                        const profUrl = `https://api.utdnebula.com/professor?first_name=${encodeURIComponent(cleanFirstName)}&last_name=${encodeURIComponent(cleanLastName)}`;
                        const resp = await fetch(profUrl, { headers: { 'x-api-key': process.env.NEBULA_API_KEY! } });
                        if (resp.ok) {
                            const data = await resp.json() as any;
                            if (data.data?.length > 0) nebulaProfData = data.data[0];
                        }
                    } catch (e) { console.error('Nebula lookup failed', e); }

                    // Create professor entry
                    professorId = `prof_${cleanFirstName.toLowerCase()}_${cleanLastName.toLowerCase()}`.replace(/\s+/g, '_');
                    await Professor.findOneAndUpdate(
                        { _id: professorId },
                        {
                            _id: professorId,
                            first_name: nebulaProfData?.first_name || cleanFirstName,
                            last_name: nebulaProfData?.last_name || cleanLastName,
                            course_prefix: cleanCourseName.split(/\s+/)[0] || 'COURSE',
                            course_number: cleanCourseName.split(/\s+/)[1] || '101',
                            email: nebulaProfData?.email || '',
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                }
            }

            // Normalize names for better UI display
            const titleCase = (s: string) => (s || '').trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            const displayProfName = `${titleCase(cleanFirstName)} ${titleCase(cleanLastName)}`;

            room = {
                code: roomCode,
                players: [],
                currentTurn: 0,
                profId: professorId,
                profName: displayProfName,
                isGenerating: false
            };
            rooms.set(roomCode, room);
        } else {
            console.log(`[joinRoom] Room ${roomCode} exists. Professor: ${room.profName}`);
        }

        socket.join(roomCode);

        // Check if player is already in room (reconnection)
        let player = room.players.find(p => p.username === username);
        if (player) {
            player.id = socket.id; // Update socket ID on reconnect
        } else if (room.players.length < 2) {
            player = {
                id: socket.id,
                username: username,
                ships: generateRandomShips(),
                hitCoordinates: [],
                missCoordinates: []
            };
            room.players.push(player);
            console.log(`User ${username} joined room ${roomCode}`);
        }

        // --- Determine and Send Game State ---
        const existingCount = await Question.countDocuments({ prof_id: room.profId });
        console.log(`[joinRoom] Room ${roomCode} has ${existingCount} questions. Players: ${room.players.length}`);
        
        if (existingCount >= 30) {
            // Questions ready, send GAME state to this player (and maybe their opponent if they just joined)
            if (room.players.length === 2) {
                console.log(`[joinRoom] Room ${roomCode} starting GAME mode`);
                room.players.forEach((p, idx) => {
                    const opponent = room.players[(idx + 1) % 2];
                    io.to(p.id).emit('gameState', {
                        status: 'GAME',
                        players: room.players.map(pl => ({ id: pl.id, username: pl.username })),
                        currentTurnId: room.players[room.currentTurn].id,
                        profName: room.profName,
                        myShips: p.ships,
                        hits: p.hitCoordinates,
                        misses: p.missCoordinates,
                        opponentHits: opponent.hitCoordinates,
                        opponentMisses: opponent.missCoordinates
                    });
                });
            } else {
                console.log(`[joinRoom] Room ${roomCode} waiting for player 2 (Questions ready)`);
                socket.emit('gameState', {
                    status: 'LOADING',
                    roomCode: room.code,
                    profName: room.profName,
                    myShips: player!.ships
                });
            }
        } else {
            console.log(`[joinRoom] Room ${roomCode} needs AI generation (Count: ${existingCount})`);
            // Not ready, show LOADING
            socket.emit('gameState', {
                status: 'LOADING',
                roomCode: room.code,
                profName: room.profName,
                myShips: player!.ships
            });

            // Start RAG Pipeline if not already started
            if (!room.isGenerating) {
                console.log(`[joinRoom] Starting RAG Pipeline for room ${roomCode}`);
                room.isGenerating = true;
                room.loadingStatus = { step: 'Initializing Gemini...', progress: 5 };
                
                const thoughtsInterval = setInterval(() => {
                    const extraThoughts = [
                        "Synthesizing course objectives...",
                        "Identifying key academic concepts...",
                        "Cross-referencing subject matter with web grounding...",
                        "Structuring difficulty levels...",
                        "Generating pedagogical challenges...",
                        "Filtering administrative metadata...",
                        "Analyzing course learning outcomes..."
                    ];
                    const randomThought = extraThoughts[Math.floor(Math.random() * extraThoughts.length)];
                    io.to(roomCode).emit('loading_progress', { 
                        step: room?.loadingStatus?.step || 'Gemini is thinking...', 
                        progress: room?.loadingStatus?.progress || 50,
                        thought: randomThought 
                    });
                }, 5000);

                (async () => {
                    try {
                        const updateStatus = (step: string, progress: number, thought?: string) => {
                            if (room) {
                                room.loadingStatus = { step, progress };
                                io.to(roomCode).emit('loading_progress', { step, progress, thought });
                            }
                        };

                        updateStatus('Locating professor...', 10, 'Searching for teacher record in local archives...');
                        
                        const professor = await Professor.findById(room!.profId);
                        if (!professor) throw new Error("Professor not found");

                        console.log(`🚀 Starting RAG pipeline for ${room!.profName}...`);
                        updateStatus('Syllabus ingestion started...', 20, 'No questions cached. Initializing syllabus retrieval...');
                        
                        if (!professor.syllabus_gemini_uri) {
                            updateStatus('Fetching syllabus from Nebula API...', 30, `Connecting to UTD Nebula API to find ${room!.profName}'s newest syllabus...`);
                            await ingestSyllabus(room!.profId);
                        }
                        
                        const updatedProf = await Professor.findById(room!.profId);
                        if (updatedProf?.syllabus_gemini_uri) {
                            updateStatus('Gemini is thinking...', 50, 'Extracting key academic concepts and learning objectives from PDF...');
                            await generateQuestions(updatedProf.syllabus_gemini_uri, room!.profId);
                            updateStatus('Structuring questions...', 90, 'Finalizing 30 questions into Easy, Medium, and Hard tiers...');
                        } else {
                            throw new Error("Failed to obtain syllabus URI");
                        }

                        // Success, move to GAME if we have 2 players
                        clearInterval(thoughtsInterval);
                        room!.isGenerating = false;
                        room!.loadingStatus = { step: 'Ready', progress: 100 };
                        
                        if (room!.players.length === 2) {
                            console.log(`[RAG] Pipeline complete, room ${roomCode} has 2 players, starting GAME mode`);
                            room!.players.forEach((p, idx) => {
                                const opponent = room!.players[(idx + 1) % 2];
                                io.to(p.id).emit('gameState', {
                                    status: 'GAME',
                                    players: room!.players.map(pl => ({ id: pl.id, username: pl.username })),
                                    currentTurnId: room!.players[room!.currentTurn].id,
                                    profName: room!.profName,
                                    myShips: p.ships,
                                    hits: p.hitCoordinates,
                                    misses: p.missCoordinates,
                                    opponentHits: opponent.hitCoordinates,
                                    opponentMisses: opponent.missCoordinates
                                });
                            });
                        } else {
                            console.log(`[RAG] Pipeline complete, room ${roomCode} waiting for player 2`);
                            io.to(roomCode).emit('loading_progress', { 
                                step: 'Awaiting challenger...', 
                                progress: 100, 
                                thought: 'Trivia matrix initialized. Waiting for player 2 to join...' 
                            });
                        }
                    } catch (err) {
                        clearInterval(thoughtsInterval);
                        if (room) {
                            room.isGenerating = false;
                            room.loadingStatus = { step: 'Failed', progress: 0 };
                        }
                        console.error("Error in RAG pipeline:", err);
                        io.to(roomCode).emit('error', `Generation Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                })();
            } else if (room.loadingStatus) {
                // Already generating, send current status to the new player
                console.log(`[joinRoom] Room ${roomCode} is already generating. Sending current status: ${room.loadingStatus.step}`);
                socket.emit('loading_progress', { 
                    step: room.loadingStatus.step, 
                    progress: room.loadingStatus.progress, 
                    thought: 'Catching up with Gemini processor...' 
                });
            }
        }
    });

    socket.on('fire_missile', async (data: { roomCode: string, x: number, y: number }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        // Turn guard
        if (socket.id !== room.players[room.currentTurn].id) {
            return socket.emit('error', 'Not your turn!');
        }

        const opponentIndex = (room.currentTurn + 1) % 2;
        const opponent = room.players[opponentIndex];
        const isHit = opponent.ships.some(s => s.x === data.x && s.y === data.y);

        if (isHit) {
            // Trigger combat - pick a random question
            const questions = await Question.find({ prof_id: room.profId });
            if (questions.length === 0) {
                return socket.emit('error', 'AI Failed to prepare questions for this course. Please re-join.');
            }
            const randomQ = questions[Math.floor(Math.random() * questions.length)];
            
            io.to(data.roomCode).emit('combat_triggered', {
                targetId: socket.id, // The one who must answer
                question: randomQ,
                coordinate: { x: data.x, y: data.y }
            });
        } else {
            // Miss
            const attacker = room.players[room.currentTurn];
            attacker.missCoordinates.push({ x: data.x, y: data.y });
            
            room.currentTurn = opponentIndex;
            io.to(data.roomCode).emit('fire_result', {
                attackerId: socket.id,
                coordinate: { x: data.x, y: data.y },
                confirmed: false
            });
            io.to(data.roomCode).emit('turn_change', { nextPlayerId: room.players[room.currentTurn].id });
        }
    });

    socket.on('submit_answer', (data: { roomCode: string, isCorrect: boolean, coordinate: { x: number, y: number } }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        if (data.isCorrect) {
            const attacker = room.players[room.currentTurn];
            attacker.hitCoordinates.push(data.coordinate);
            
            io.to(data.roomCode).emit('fire_result', {
                attackerId: attacker.id,
                coordinate: data.coordinate,
                confirmed: true
            });

            // Check Win Condition
            if (attacker.hitCoordinates.length === 17) {
                io.to(data.roomCode).emit('gameOver', { winnerId: attacker.id, winnerName: attacker.username });
            }
            // Do not swap turns on hit
        } else {
            // Incorrect answer
            const attacker = room.players[room.currentTurn];
            attacker.missCoordinates.push(data.coordinate);

            room.currentTurn = (room.currentTurn + 1) % 2;
            io.to(data.roomCode).emit('fire_result', {
                attackerId: socket.id,
                coordinate: data.coordinate,
                confirmed: false
            });
            io.to(data.roomCode).emit('turn_change', { nextPlayerId: room.players[room.currentTurn].id });
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} disconnected for ${reason}`);
    });
});

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});