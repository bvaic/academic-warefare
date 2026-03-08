import React from 'react';
import './Leaderboard.css';

interface LeaderboardProps {
    onPlayAgain: () => void;
    onHome: () => void;
}

const MOCK_LEADERBOARD = [
    { rank: 1, name: 'AlexTheGreat', score: 3000, streak: 5 },
    { rank: 2, name: 'SyllabusSlayer', score: 2850, streak: 3 },
    { rank: 3, name: 'ProfessorX', score: 2700, streak: 12 },
    { rank: 4, name: 'StudyBot99', score: 2100, streak: 0 },
    { rank: 5, name: 'CoffeeAddict', score: 1950, streak: 2 },
];

const Leaderboard: React.FC<LeaderboardProps> = ({ onPlayAgain, onHome }) => {
    return (
        <div className="leaderboard-view animate-fade-in">

            <div className="leaderboard-header">
                <h2 className="title-xl text-gradient">Hall of Fame</h2>
                <p className="subtitle">Top students across all courses</p>
            </div>

            <div className="leaderboard-card glass-panel animate-slide-up">
                <div className="lb-table-header">
                    <span>Rank</span>
                    <span>Player</span>
                    <span>Streak</span>
                    <span className="align-right">Score</span>
                </div>

                <div className="lb-list">
                    {MOCK_LEADERBOARD.map((player, idx) => (
                        <div
                            key={player.rank}
                            className={`lb-row ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''}`}
                        >
                            <div className="lb-rank">
                                {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${player.rank}`}
                            </div>
                            <div className="lb-name">{player.name}</div>
                            <div className="lb-streak">
                                {player.streak > 0 ? `🔥 ${player.streak}` : '-'}
                            </div>
                            <div className="lb-score align-right">{player.score.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="leaderboard-actions animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
                    Play Again
                </button>
                <button className="btn btn-outline btn-large" onClick={onHome}>
                    Home
                </button>
            </div>

        </div>
    );
};

export default Leaderboard;
