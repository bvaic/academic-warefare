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
    // Normalize names to Title Case for Nebula API which can be case-sensitive
    const normalize = (name: string) => name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    
    const firstName = normalize(profFirstName);
    const lastName = normalize(profLastName);
    
    const apiKey = process.env.NEBULA_API_KEY!;

    try {
        // 1. Find Professor by Name
        const profUrl = `https://api.utdnebula.com/professor?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`;
        const profResponse = await fetch(profUrl, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
        });

        if (!profResponse.ok) {
            throw new Error(`Failed to fetch professor by name: ${profResponse.statusText}`);
        }

        const profData = await profResponse.json() as any;
        if (!profData.data || profData.data.length === 0) {
            console.log(`✗ Professor ${firstName} ${lastName} not found in Nebula with Title Case. Trying raw names...`);
            
            // Fallback: try with raw names as provided
            const rawUrl = `https://api.utdnebula.com/professor?first_name=${encodeURIComponent(profFirstName.trim())}&last_name=${encodeURIComponent(profLastName.trim())}`;
            const rawResponse = await fetch(rawUrl, {
                headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
            });
            
            if (rawResponse.ok) {
                const rawData = await rawResponse.json() as any;
                if (rawData.data && rawData.data.length > 0) {
                    profData.data = rawData.data;
                    console.log(`✓ Found professor with raw names.`);
                }
            }
        }

        if (!profData.data || profData.data.length === 0) {
            console.log(`✗ Professor ${firstName} ${lastName} not found in Nebula.`);
            return null;
        }

        const profId = profData.data[0]._id;
        console.log(`✓ Found professor ID: ${profId} for ${firstName} ${lastName}`);

        // 2. Fetch Sections for that Professor ID
        const sectionsUrl = `https://api.utdnebula.com/professor/${profId}/sections`;
        const sectionsResponse = await fetch(sectionsUrl, {
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
        });

        if (!sectionsResponse.ok) {
            throw new Error(`Failed to fetch professor sections: ${sectionsResponse.statusText}`);
        }

        const sectionsData = await sectionsResponse.json() as any;
        console.log(`✓ Nebula API responded with ${sectionsData.data?.length || 0} sections for professor ${profId}.`);

        // Filter for syllabus_uri and find the most recent one
        const syllabusUris = (sectionsData.data || [])
            .filter((section: any) => section.syllabus_uri && section.syllabus_uri.length > 0)
            .map((section: any) => section.syllabus_uri);

        if (syllabusUris.length === 0) {
            console.log(`✗ No syllabus URIs found for professor ${profId}.`);
            return null;
        }

        // Return the most recent one (usually the last in the array)
        const latestSyllabusUri = syllabusUris[syllabusUris.length - 1];
        console.log(`✓ Found syllabus URI: ${latestSyllabusUri}`);

        return latestSyllabusUri;

    } catch (error) {
        console.error(`Error in getSyllabusUri:`, error);
        throw error;
    }
}
