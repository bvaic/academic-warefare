import React, { useEffect, useState } from 'react';
import { api, Course, Professor } from '../services/api';
import './CourseSelection.css';

interface CourseSelectionProps {
    onSelect: (courseId: string) => void;
    onBack: () => void;
}

// Helper component to fetch and render Professor info
const ProfessorInfo: React.FC<{ profId: string }> = ({ profId }) => {
    const [prof, setProf] = useState<Professor | null>(null);

    useEffect(() => {
        let active = true;
        api.getProfessor(profId).then(data => {
            if (active) setProf(data);
        });
        return () => { active = false; };
    }, [profId]);

    if (!prof) return <span className="prof-loading">Loading professor info...</span>;

    return (
        <div className="prof-details">
            <span className="prof-name">Prof. {prof.first_name} {prof.last_name}</span>
            {prof.syllabus_source_url ? (
                <span className="badge-ready">Syllabus Ready</span>
            ) : (
                <span className="badge-pending">Pending Ingestion</span>
            )}
        </div>
    );
};

const CourseSelection: React.FC<CourseSelectionProps> = ({ onSelect, onBack }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getCourses().then(data => {
            setCourses(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="course-view animate-fade-in">

            <header className="course-header">
                <button className="btn btn-outline btn-icon" onClick={onBack} aria-label="Go Back">
                    ← Back
                </button>
                <div className="header-titles">
                    <h2>Select Your Battlefield</h2>
                    <p className="subtitle">Choose a course to test your knowledge</p>
                </div>
            </header>

            {loading ? (
                <div className="loader-container">
                    <div className="spinner"></div>
                    <p>Loading active courses...</p>
                </div>
            ) : (
                <div className="course-grid">
                    {courses.map((course, i) => (
                        <div
                            key={course._id}
                            className="glass-card course-card animate-slide-up"
                            style={{ animationDelay: `${i * 0.1}s` }}
                            onClick={() => onSelect(course._id)}
                        >
                            <div className="course-card-bg"></div>
                            <div className="course-card-content">
                                <div className="course-header-row">
                                    <span className="course-id">{course._id}</span>
                                </div>
                                <h3 className="course-name">{course.name}</h3>
                                <ProfessorInfo profId={course.prof_id} />
                                <div className="card-action">
                                    <span>Enter Arena</span>
                                    <span className="arrow">→</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseSelection;
