import React, { useState, useEffect } from 'react';
import { api, Question, Course } from '../services/api';
import './GameInterface.css';

interface GameInterfaceProps {
    courseId: string | null;
    onFinish: () => void;
    onExit: () => void;
}

const GameInterface: React.FC<GameInterfaceProps> = ({ courseId, onFinish, onExit }) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    // Fetch course and questions
    useEffect(() => {
        if (!courseId) return;

        let active = true;
        const loadGameData = async () => {
            // 1. Get Course Info to find prof_id
            const courses = await api.getCourses();
            const currentCourse = courses.find(c => c._id === courseId);

            if (currentCourse && active) {
                setCourse(currentCourse);
                // 2. Fetch questions for that prof_id
                const qData = await api.getQuestions(currentCourse.prof_id, 'All');
                if (active) {
                    setQuestions(qData);
                    setLoading(false);
                }
            }
        };

        loadGameData();
        return () => { active = false; };
    }, [courseId]);

    if (loading) {
        return (
            <div className="loader-container">
                <div className="spinner"></div>
                <p>Generating Battle Arena...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="game-view empty-state animate-fade-in">
                <h2>No questions available!</h2>
                <p className="subtitle">The syllabus might still be processing.</p>
                <button className="btn btn-primary" onClick={onExit} style={{ marginTop: '2rem' }}>Go Back</button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    const handleOptionClick = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleSubmit = () => {
        if (!selectedOption || isAnswered) return;

        setIsAnswered(true);
        if (selectedOption === currentQ.correct_answer) {
            setScore(s => s + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            onFinish();
        }
    };

    const getOptionStatusClass = (option: string) => {
        if (!isAnswered) return selectedOption === option ? 'selected' : '';
        if (option === currentQ.correct_answer) return 'correct';
        if (selectedOption === option) return 'incorrect';
        return 'disabled';
    };

    return (
        <div className="game-view animate-fade-in">
            <header className="game-header">
                <button className="btn btn-outline btn-icon" onClick={onExit}>Exit</button>
                <div className="game-meta">
                    <span className="course-badge">{course?.name}</span>
                    <span className="question-counter">
                        Question {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="score-badge">Score: {score}</span>
                </div>
            </header>

            <div className="game-board glass-panel">
                <div className="question-section">
                    <div className="difficulty-badge">{currentQ.difficulty}</div>
                    <h2 className="question-text">{currentQ.question_text}</h2>
                </div>

                <div className="options-grid">
                    {currentQ.options.map((option, idx) => (
                        <button
                            key={idx}
                            className={`glass-card option-card ${getOptionStatusClass(option)} animate-slide-up`}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                            onClick={() => handleOptionClick(option)}
                            disabled={isAnswered}
                        >
                            <div className="option-marker">{String.fromCharCode(65 + idx)}</div>
                            <div className="option-text">{option}</div>
                        </button>
                    ))}
                </div>

                <div className="action-section">
                    {!isAnswered ? (
                        <button
                            className={`btn btn-primary btn-submit ${selectedOption ? '' : 'btn-disabled'}`}
                            onClick={handleSubmit}
                            disabled={!selectedOption}
                        >
                            Lock in Answer
                        </button>
                    ) : (
                        <div className="feedback-section animate-slide-up">
                            <div className={`feedback-banner ${selectedOption === currentQ.correct_answer ? 'success' : 'error'}`}>
                                <h3>{selectedOption === currentQ.correct_answer ? 'Brilliant!' : 'Incorrect'}</h3>
                                <p>{currentQ.explanation}</p>
                            </div>
                            <button className="btn btn-primary btn-next" onClick={handleNext}>
                                {currentIndex < questions.length - 1 ? 'Next Question →' : 'View Results'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameInterface;
