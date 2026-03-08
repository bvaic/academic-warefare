import 'dotenv/config';

interface Professor {
    first_name: string,
    last_name: string
}

interface Course {
    professor_details: Professor[]
    syllabus_uri: string;
}

interface CourseData {
    data: Course[] 
}

export async function getSyllabusUri(coursePrefix: string, courseNumber: string, profFirstName: string, profLastName: string) {
    const coursesUrl = `https://api.utdnebula.com/course/sections/trends?course_number=${courseNumber}&subject_prefix=${coursePrefix}`; 
        
    const response = await fetch(coursesUrl, {
        headers: {
            'x-api-key': process.env.NEBULA_API_KEY!,
            'Content-Type': 'application/json'
        }
    }); 
    
    if (!response.ok) {
        throw new Error(`couldn't fetch data from nebula api`);
    }
    
    const responseJSON: CourseData = await response.json() as CourseData;
    
    const targetProfessorCourses: Course[] = [];
    
    responseJSON.data.forEach((course: Course) => {
        const courseProfFirstName = course.professor_details[0]?.first_name;
        const courseProfLastName = course.professor_details[0]?.last_name;
        
        // console.log(course.syllabus_uri);

        if (courseProfFirstName === profFirstName && courseProfLastName === profLastName) {
            targetProfessorCourses.push(course);
        }
    });
    
    const latestResumeUri = targetProfessorCourses[targetProfessorCourses.length - 1]?.syllabus_uri;
    
    return latestResumeUri;
}
