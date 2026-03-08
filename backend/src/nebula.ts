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

export async function getSyllabusUri(profFirstName: string, profLastName: string) {
    const firstName = profFirstName.trim();
    const lastName = profLastName.trim();
    const apiKey = process.env.NEBULA_API_KEY!;

    try {
        // Search course sections by professor name
        const sectionsUrl = `https://api.utdnebula.com/course/sections?instructor_first_name=${encodeURIComponent(firstName)}&instructor_last_name=${encodeURIComponent(lastName)}`;
        const sectionsResponse = await fetch(sectionsUrl, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
        });

        if (!sectionsResponse.ok) {
            throw new Error(`Failed to fetch sections by professor name: ${sectionsResponse.statusText}`);
        }

        const sectionsData = await sectionsResponse.json() as any;
        console.log(`✓ Nebula API responded with ${sectionsData.data?.length || 0} sections for professor ${firstName} ${lastName}.`);

        // Filter for syllabus_uri and find the most recent one
        const syllabusUris = (sectionsData.data || [])
            .filter((section: any) => section.syllabus_uri && section.syllabus_uri.length > 0)
            .map((section: any) => section.syllabus_uri);

        if (syllabusUris.length === 0) {
            console.log(`✗ No syllabus URIs found for professor ${firstName} ${lastName}.`);
            return null;
        }

        // Return the most recent one
        const latestSyllabusUri = syllabusUris[0];
        console.log(`✓ Found syllabus URI: ${latestSyllabusUri}`);

        return latestSyllabusUri;

    } catch (error) {
        console.error(`Error in getSyllabusUri:`, error);
        throw error;
    }
}
