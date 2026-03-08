import { Course, User } from './models.js'; // courseName should be something like 'CS 1200' async function courseExists( courseName: string, profFirstName: string, profLastName: string): Promise<boolean> { populate professor's data into the course object so that the name fields can be used for filtering const matchingCourses = await Course.find({ course_name: courseName, }).populate('professor_id');

// courseName should be something like 'CS 1200'
export async function courseExists(
    courseName: string,
    profFirstName: string,
    profLastName: string
): Promise<boolean> {

    const matchingCourses = await Course.find({
        course_name: { $regex: new RegExp(`^${courseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
    }).populate('prof_id');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exists = matchingCourses.some((course: any) => {
        const professor = course.prof_id;

        // professor must exist and match both names
        return (
            professor &&
            professor.first_name.toLowerCase() === profFirstName.toLowerCase() &&
            professor.last_name.toLowerCase() === profLastName.toLowerCase()
        );
    });
    
    return exists;
}

export async function registerUserToCourse(
    userId: string,
    courseId: string,
    professorId: string): Promise<void> {

    try {
        const result = await User.findByIdAndUpdate(
            userId,
            {
                $addToSet: {
                    course_list: courseId,
                    professor_list: professorId
                }
            },
            { new: true }
        );
        
        if (!result) {
            throw new Error('user not found in database');
        }
        
        console.log(`registered user ${userId} to course ${courseId}`);

    } catch (err) {
        console.error(err);
        throw err;
    } 
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
    try {
        const user = await User.findOne({ username: username }).select('_id').exec();

        if (!user) {
            return null;
        }
        
        return user._id;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getCourseIdAndProfessorId(
    courseName: string,
    profFirstName: string,
    profLastName: string
){
    const matchingCourses = await Course.find({
        course_name: { $regex: new RegExp(`^${courseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }, 
    }).populate('prof_id');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const course of matchingCourses as any[]) {
        const professor = course.prof_id;
        
        if (professor && 
            professor.first_name.toLowerCase() === profFirstName.toLowerCase() && 
            professor.last_name.toLowerCase() === profLastName.toLowerCase()) {
            return {
                courseId: course._id,
                professorId: professor._id
            };
        }
    }
    
    return { courseId: '', professorId: '' };
}
