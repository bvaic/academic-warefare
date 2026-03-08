import { useState } from 'react';
import './App.css';
import LandingPage from './components/LandingPage';
import CourseSelection from './components/CourseSelection';
import GameInterface from './components/GameInterface';
import Leaderboard from './components/Leaderboard';

// Defining game phases
export type GamePhase = 'LANDING' | 'COURSE_SELECTION' | 'GAME' | 'LEADERBOARD';

function App() {
  const [phase, setPhase] = useState<GamePhase>('LANDING');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const renderPhase = () => {
    switch (phase) {
      case 'LANDING':
        return <LandingPage onStart={() => setPhase('COURSE_SELECTION')} />;
      case 'COURSE_SELECTION':
        return (
          <CourseSelection 
            onSelect={(courseId) => {
              setSelectedCourse(courseId);
              setPhase('GAME');
            }} 
            onBack={() => setPhase('LANDING')}
          />
        );
      case 'GAME':
        return (
          <GameInterface 
            courseId={selectedCourse} 
            onFinish={() => setPhase('LEADERBOARD')}
            onExit={() => setPhase('COURSE_SELECTION')}
          />
        );
      case 'LEADERBOARD':
        return (
          <Leaderboard 
            onPlayAgain={() => setPhase('COURSE_SELECTION')}
            onHome={() => setPhase('LANDING')}
          />
        );
      default:
        return <LandingPage onStart={() => setPhase('COURSE_SELECTION')} />;
    }
  };

  return (
    <div className="app-container">
      {/* Abstract Background Elements */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      {/* Main Content Area */}
      <main className="container">
        {renderPhase()}
      </main>
    </div>
  );
}

export default App;
