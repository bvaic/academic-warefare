import mongoose, { Schema } from 'mongoose';

// Interfaces
export interface IUser {
  _id: string;
  name: string;
  pwd: string;
  course_list: string[];
}

export interface ICourse {
  _id: string;
  name: string;
  leaderboard: any[];
  prof_id: string;
}

export interface IProfessor {
  _id: string;
  first_name: string;
  last_name: string;
  course_prefix: string;
  course_number: string;
  syllabus_source_url: string | null;
  syllabus_gemini_uri: string | null;
  user_note_id: string[];
}

export interface IUserNote {
  _id: string;
  content: string;
}

export interface IQuestion {
  _id: string;
  prof_id: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

// Schemas
const UserSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  pwd: { type: String, required: true },
  course_list: [{ type: String, ref: 'Course' }]
}, { _id: false });

const CourseSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  leaderboard: [Schema.Types.Mixed],
  prof_id: { type: String, ref: 'Professor', required: true }
}, { _id: false });

const ProfessorSchema = new Schema({
  _id: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  course_prefix: { type: String, required: true },
  course_number: { type: String, required: true },
  syllabus_source_url: { type: String, default: null },
  syllabus_gemini_uri: { type: String, default: null },
  user_note_id: [{ type: String, ref: 'UserNote' }]
}, { _id: false });

const UserNoteSchema = new Schema({
  _id: { type: String, required: true },
  content: { type: String, required: true }
}, { _id: false });

const QuestionSchema = new Schema({
  _id: { type: String, required: true },
  prof_id: { type: String, ref: 'Professor', required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  question_text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_answer: { type: String, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

// Models
export const User = mongoose.model<IUser>('User', UserSchema);
export const Course = mongoose.model<ICourse>('Course', CourseSchema);
export const Professor = mongoose.model<IProfessor>('Professor', ProfessorSchema);
export const UserNote = mongoose.model<IUserNote>('UserNote', UserNoteSchema);
export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
