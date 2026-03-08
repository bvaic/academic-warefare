import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import './BattleshipGame.css';

type GameState = 'LOBBY' | 'LOADING' | 'GAME' | 'FINISHED';

interface Question {
    _id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
}

const BattleshipGame: React.FC = () => {
    const socket = useContext(SocketContext);
    const [view, setView] = useState<GameState>('LOBBY');
    const [roomCode, setRoomCode] = useState('');
    const [username, setUsername] = useState('');
    const [profFirstName, setProfFirstName] = useState('');
    const [profLastName, setProfLastName] = useState('');
    const [courseName, setCourseName] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    const [myTurn, setMyTurn] = useState(false);
    const [players, setPlayers] = useState<{ id: string, username: string }[]>([]);
    const [currentProf, setCurrentProf] = useState('');
    const [myShips, setMyShips] = useState<{ x: number, y: number }[]>([]);
    const [hits, setHits] = useState<{ x: number, y: number }[]>([]);
    const [misses, setMisses] = useState<{ x: number, y: number }[]>([]);
    const [opponentHits, setOpponentHits] = useState<{ x: number, y: number }[]>([]);
    const [opponentMisses, setOpponentMisses] = useState<{ x: number, y: number }[]>([]);
    
    const [isChecking, setIsChecking] = useState(false);
    const [combatData, setCombatData] = useState<{ question: Question, coordinate: { x: number, y: number } } | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ correct: boolean, explanation: string } | null>(null);

    const [loadingStep, setLoadingStep] = useState('Initializing...');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [thoughts, setThoughts] = useState<string[]>(['Neural link established...', 'Waiting for Gemini processor...']);

    const [winner, setWinner] = useState<string | null>(null);
    const [moveX, setMoveX] = useState('');
    const [moveY, setMoveY] = useState('');

    useEffect(() => {
        if (!socket) return;

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        
        const resetChecking = () => setIsChecking(false);

        // The Global Unlocker: prevent "Checking Shot" freeze
        const globalUnlocker = () => setIsChecking(false);
        
        // Apply global listener to all incoming events
        const originalOn = socket.on.bind(socket);
        // We can't easily wrap socket.on here without potentially causing issues,
        // but we can add the resetChecking call to every specific listener.
        // Actually, the requirement says "add a universal listener in your useEffect 
        // that sets setIsChecking(false) on every incoming socket event."
        
        // Socket.io doesn't have a direct "onAny" in the client version 4.x unless specified,
        // but we can use socket.onAny if available or just ensure it's in every handler.
        if ((socket as any).onAny) {
            (socket as any).onAny(globalUnlocker);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        setIsConnected(socket.connected);

        socket.on('gameState', (data: any) => {
            resetChecking();
            if (data.status) setView(data.status);
            if (data.players) setPlayers(data.players);
            if (data.currentTurnId) setMyTurn(socket.id === data.currentTurnId);
            if (data.profName) setCurrentProf(data.profName);
            if (data.myShips) setMyShips(data.myShips);
            if (data.hits) setHits(data.hits);
            if (data.misses) setMisses(data.misses);
            if (data.opponentHits) setOpponentHits(data.opponentHits);
            if (data.opponentMisses) setOpponentMisses(data.opponentMisses);
        });

        socket.on('turn_change', (data: { nextPlayerId: string }) => {
            resetChecking();
            setMyTurn(socket.id === data.nextPlayerId);
        });

        socket.on('combat_triggered', (data: { targetId: string, question: Question, coordinate: { x: number, y: number }, sourceMaterial?: string }) => {
            resetChecking();
            if (socket.id === data.targetId) {
                // Merge sourceMaterial into question if provided
                const questionWithSource = { 
                    ...data.question, 
                    explanation: data.sourceMaterial || data.question.explanation 
                };
                setCombatData({ question: questionWithSource, coordinate: data.coordinate });
            }
        });

        socket.on('fire_result', (data: { attackerId: string, coordinate: { x: number, y: number }, confirmed: boolean }) => {
            resetChecking();
            const { attackerId, coordinate, confirmed } = data;
            if (attackerId === socket.id) {
                if (confirmed) setHits(prev => [...prev, coordinate]);
                else setMisses(prev => [...prev, coordinate]);
            } else {
                if (confirmed) setOpponentHits(prev => [...prev, coordinate]);
                else setOpponentMisses(prev => [...prev, coordinate]);
            }
        });

        socket.on('loading_progress', (data: { step: string, progress: number, thought?: string }) => {
            resetChecking();
            setLoadingStep(data.step);
            setLoadingProgress(data.progress);
            if (data.thought) {
                setThoughts(prev => [...prev.slice(-4), data.thought!]);
            }
        });

        socket.on('gameOver', (data: { winnerId: string, winnerName: string }) => {
            resetChecking();
            setView('FINISHED');
            setWinner(data.winnerName);
        });

        socket.on('error', (msg: string) => {
            resetChecking();
            alert(msg);
        });

        return () => {
            if ((socket as any).offAny) (socket as any).offAny(globalUnlocker);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('gameState');
            socket.off('turn_change');
            socket.off('combat_triggered');
            socket.off('fire_result');
            socket.off('loading_progress');
            socket.off('gameOver');
            socket.off('error');
        };
    }, [socket]);

    const joinRoom = () => {
        if (!roomCode || !username) return;
        if (roomCode.length !== 4) {
            alert('Room code must be exactly 4 characters.');
            return;
        }
        // Only require other fields if we are creating a room
        // But since we don't know yet, we'll send what we have
        socket?.emit('joinRoom', { roomCode, username, profFirstName, profLastName, courseName });
    };

    const fireMissile = () => {
        let x = parseInt(moveX);
        let y = parseInt(moveY);

        // Handle "From" and "To" text inputs if they are characters like A-J
        const parseCoord = (val: string) => {
            const v = val.trim().toUpperCase();
            if (v.length === 0) return NaN;
            if (v >= 'A' && v <= 'J') return v.charCodeAt(0) - 65;
            return parseInt(v);
        };

        const finalX = parseCoord(moveX);
        const finalY = parseCoord(moveY);

        if (isNaN(finalX) || isNaN(finalY) || finalX < 0 || finalX > 9 || finalY < 0 || finalY > 9) {
            alert("Please enter valid coordinates (0-9 or A-J)");
            return;
        }
        
        setIsChecking(true);
        socket?.emit('fire_missile', { roomCode, x: finalX, y: finalY });
        setMoveX('');
        setMoveY('');
    };

    const submitAnswer = () => {
        if (!combatData || !selectedOption) return;
        const isCorrect = selectedOption === combatData.question.correct_answer;
        setFeedback({ correct: isCorrect, explanation: combatData.question.explanation });
        
        setTimeout(() => {
            socket?.emit('submit_answer', { 
                roomCode, 
                isCorrect, 
                coordinate: combatData.coordinate 
            });
            setCombatData(null);
            setSelectedOption(null);
            setFeedback(null);
        }, 3000);
    };

    const renderGrid = (isOpponent: boolean) => {
        const grid = [];
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                let status = '';
                if (isOpponent) {
                    if (hits.some(h => h.x === x && h.y === y)) status = 'hit';
                    else if (misses.some(m => m.x === x && m.y === y)) status = 'miss';
                } else {
                    if (opponentHits.some(h => h.x === x && h.y === y)) status = 'hit';
                    else if (opponentMisses.some(m => m.x === x && m.y === y)) status = 'miss';
                    else if (myShips.some(s => s.x === x && s.y === y)) status = 'ship';
                }
                grid.push(<div key={`${x}-${y}`} className={`cell ${status}`} onClick={() => {
                    if (isOpponent && myTurn && !isChecking) {
                        setMoveX(x.toString());
                        setMoveY(y.toString());
                    }
                }}>{status === 'hit' ? '💥' : status === 'miss' ? '🌊' : status === 'ship' ? '🚢' : ''}</div>);
            }
        }
        return grid;
    };

    return (
        <div className="battleship-container neon-theme">
            <header className="game-header">
                <h1>ACADEMIC WARFARE: BATTLESHIP</h1>
                <div className={`heartbeat ${isConnected ? 'online' : 'offline'}`}></div>
                {view === 'GAME' && <div className="room-info">ROOM: {roomCode} | PROF: {currentProf}</div>}
            </header>

            {view === 'LOBBY' && (
                <div className="lobby-view glass-panel">
                    <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <input 
                        placeholder="Room Code (4-digit)" 
                        value={roomCode} 
                        onChange={e => setRoomCode(e.target.value.slice(0, 4))} 
                        maxLength={4}
                    />
                    <input placeholder="Course (e.g. ITSS 4330)" value={courseName} onChange={e => setCourseName(e.target.value)} />
                    <input placeholder="Prof First Name" value={profFirstName} onChange={e => setProfFirstName(e.target.value)} />
                    <input placeholder="Prof Last Name" value={profLastName} onChange={e => setProfLastName(e.target.value)} />
                    <button onClick={joinRoom}>JOIN BATTLE</button>
                </div>
            )}

            {view === 'LOADING' && (
                <div className="loading-view glass-panel animate-fade-in">
                    <div className="spinner"></div>
                    <div className="neon-room-code">JOIN CODE: {roomCode}</div>
                    <h2 className="loading-title">RECRUITING AI PROFESSORS...</h2>
                    <p className="loading-subtitle">Analyzing Syllabus for {currentProf}</p>
                    
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                    <p className="step-text">{loadingStep}</p>

                    <div className="mini-terminal">
                        {thoughts.map((t, i) => (
                            <div key={i} className="terminal-line">
                                <span className="terminal-prefix">gemini@warfare:~$</span>
                                <span className="terminal-text">{t}</span>
                            </div>
                        ))}
                        <div className="terminal-line">
                            <span className="terminal-prefix">gemini@warfare:~$</span>
                            <span className="terminal-text cursor">_</span>
                        </div>
                    </div>
                </div>
            )}

            {view === 'GAME' && (
                <div className="game-view">
                    <div className="turn-indicator">
                        {myTurn ? <span className="your-turn">YOUR ATTACK</span> : <span className="waiting">OPPONENT'S TURN</span>}
                    </div>

                    <div className="boards-container">
                        <div className="board-wrapper">
                            <h3>OPPONENT WATERS (Target)</h3>
                            <div className="grid opponent-grid">{renderGrid(true)}</div>
                        </div>
                        <div className="board-wrapper">
                            <h3>YOUR WATERS (Defense)</h3>
                            <div className="grid player-grid">{renderGrid(false)}</div>
                        </div>
                    </div>

                    <div className="controls glass-panel">
                        <div className="input-group">
                            <label>From (X):</label>
                            <input type="text" placeholder="0-9 or A-J" value={moveX} onChange={e => setMoveX(e.target.value)} />
                            <label>To (Y):</label>
                            <input type="text" placeholder="0-9 or A-J" value={moveY} onChange={e => setMoveY(e.target.value)} />
                            <button onClick={fireMissile} disabled={!myTurn || isChecking}>FIRE MISSILE</button>
                        </div>
                        {isChecking && <div className="checking-shot">CHECKING SHOT... 🎯</div>}
                    </div>
                </div>
            )}

            {combatData && (
                <div className="modal-overlay">
                    <div className="trivia-modal glass-panel">
                        <h2>ACADEMIC SHIELD ACTIVATED</h2>
                        <p className="difficulty">Difficulty: {combatData.question.difficulty}</p>
                        <p className="question-text">{combatData.question.question_text}</p>
                        <div className="options-list">
                            {combatData.question.options.map((opt, i) => (
                                <button 
                                    key={i} 
                                    className={`option-btn ${selectedOption === opt ? 'selected' : ''}`}
                                    onClick={() => !feedback && setSelectedOption(opt)}
                                    disabled={!!feedback}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {!feedback ? (
                            <button className="submit-btn" onClick={submitAnswer} disabled={!selectedOption}>SUBMIT ANSWER</button>
                        ) : (
                            <div className={`feedback-area ${feedback.correct ? 'correct' : 'incorrect'}`}>
                                <h3>{feedback.correct ? 'SHIELD SUCCESS!' : 'SHIELD FAILED!'}</h3>
                                <div className="source-material">
                                    <strong>Source Material:</strong>
                                    <p>{feedback.explanation}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {view === 'FINISHED' && (
                <div className="game-over-view glass-panel animate-bounce-in">
                    <h2 className="victory-text">MISSION ACCOMPLISHED</h2>
                    <p className="winner-announcement">{winner} has dominated the academic battlefield!</p>
                    <button onClick={() => window.location.reload()}>REDEPLOY</button>
                </div>
            )}
        </div>
    );
};

export default BattleshipGame;
