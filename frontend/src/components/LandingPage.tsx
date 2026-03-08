import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="landing-container animate-fade-in">
            <div className="landing-content">

                <div className="badge animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <span className="badge-dot"></span>
                    Beta Version 1.0
                </div>

                <h1 className="title-xl landing-title animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Academic <span className="text-gradient">Warfare</span> Chess
                </h1>

                <p className="landing-subtitle animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    Battle your way through university syllabi in an epic educational trivia showdown. Outsmart your professors and conquer the leaderboard.
                </p>

                <div className="landing-actions animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <button className="btn btn-primary btn-large" onClick={onStart}>
                        Enter the Battlefield
                    </button>
                    <a href="#how-it-works" className="btn btn-outline btn-large">
                        How to Play
                    </a>
                </div>

                {/* Feature Cards */}
                <div className="features-grid animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="glass-card feature-card">
                        <div className="feature-icon">📚</div>
                        <h3>Syllabi Ingestion</h3>
                        <p>Upload your course syllabus and watch it transform into challenging trivia questions instantly.</p>
                    </div>

                    <div className="glass-card feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Generated</h3>
                        <p>Powered by Google Gemini to create intelligent, context-aware questions from your actual course material.</p>
                    </div>

                    <div className="glass-card feature-card">
                        <div className="feature-icon">🏆</div>
                        <h3>Global Leaderboard</h3>
                        <p>Compete against your peers in real-time. Do you have what it takes to be at the top of the class?</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LandingPage;
