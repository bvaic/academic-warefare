export interface Course {
    _id: string;
    name: string;
    prof_id: string;
}

export interface Professor {
    _id: string;
    first_name: string;
    last_name: string;
    course_prefix: string;
    course_number: string;
    syllabus_source_url: string | null;
}

export interface Question {
    _id: string;
    prof_id: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}

// Mock Data
const MOCK_COURSES: Course[] = [
    { _id: 'ITSS4330', name: 'Systems Analysis and Design', prof_id: 'prof_owens' },
    { _id: 'CS4349', name: 'Advanced Algorithm Design', prof_id: 'prof_smith' },
    { _id: 'BA3300', name: 'Business Communication', prof_id: 'prof_jones' }
];

const MOCK_PROFESSORS: Record<string, Professor> = {
    'prof_owens': {
        _id: 'prof_owens',
        first_name: 'John',
        last_name: 'Owens',
        course_prefix: 'ITSS',
        course_number: '4330',
        syllabus_source_url: 'https://example.com/syllabus.pdf'
    },
    'prof_smith': {
        _id: 'prof_smith',
        first_name: 'Alice',
        last_name: 'Smith',
        course_prefix: 'CS',
        course_number: '4349',
        syllabus_source_url: null
    },
    'prof_jones': {
        _id: 'prof_jones',
        first_name: 'Bob',
        last_name: 'Jones',
        course_prefix: 'BA',
        course_number: '3300',
        syllabus_source_url: null
    }
};

const MOCK_QUESTIONS: Question[] = [
    {
        _id: 'q1',
        prof_id: 'prof_owens',
        difficulty: 'Easy',
        question_text: 'What is the primary purpose of a sequence diagram?',
        options: ['To show physical hardware', 'To show interaction between objects over time', 'To model database schemas', 'To plan project timelines'],
        correct_answer: 'To show interaction between objects over time',
        explanation: 'Sequence diagrams in UML emphasize the time-ordered sequence of messages between objects.'
    },
    {
        _id: 'q2',
        prof_id: 'prof_owens',
        difficulty: 'Medium',
        question_text: 'Which of the following describes the MVC pattern?',
        options: ['Model-View-Controller', 'Main-Virtual-Component', 'Module-Variable-Class', 'Memory-Volatile-Cache'],
        correct_answer: 'Model-View-Controller',
        explanation: 'MVC is a software architectural pattern for implementing user interfaces.'
    }
];

// API wrapper
export const api = {
    async getCourses(): Promise<Course[]> {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_COURSES), 300));
    },

    async getProfessor(profId: string): Promise<Professor | null> {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_PROFESSORS[profId] || null), 200));
    },

    async getQuestions(profId: string, difficulty: string): Promise<Question[]> {
        return new Promise(resolve =>
            setTimeout(() => resolve(MOCK_QUESTIONS.filter(q => q.prof_id === profId && (difficulty === 'All' || q.difficulty === difficulty))), 400)
        );
    }
};
