import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface GeneratedBounty {
  task: string;
  rewardValue: string;
  rewardType: "xp" | "coin" | "gem";
}

export async function generateDailyBounties(
  courseTitles: string[],
  recentAchievement?: string,
): Promise<GeneratedBounty[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `
    You are a gamification expert for an educational app.
    Generate exactly 3 short, engaging daily bounties/tasks for a user.
    
    Context:
    - User is enrolled in: ${courseTitles.length > 0 ? courseTitles.join(", ") : "None"}.
    - Recent Progress: ${recentAchievement || "None"}.
    
    Guidelines:
    - If no courses, focus on exploration: "Create your first course", "Explore a new realm".
    - If recent progress exists, focus on following up: e.g. "Complete the next chapter of [Course]", "Ace a quiz in [Topic]".
    - If courses exist but no recent progress, focus on consistency: "Complete 1 chapter", "Study for 15 minutes".
    - Tasks must be short (max 40 characters).
    - Rewards: XP (50-200) or Coins (10-50).
    - Reward type must be exactly "xp" or "coin". No Gems.
    
    Return ONLY a JSON array of objects with this structure:
    [{ "task": "Task description", "rewardValue": "100", "rewardType": "xp" }]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (sometimes Gemini wraps it in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse Gemini response");
  } catch (error) {
    console.error("Error generating bounties:", error);
    // Fallback bounties
    return [
      { task: "Study for 15 minutes", rewardValue: "100", rewardType: "xp" },
      { task: "Complete 1 Chapter", rewardValue: "20", rewardType: "coin" },
      { task: "Explore New Course", rewardValue: "5", rewardType: "gem" },
    ];
  }
}

export interface GeneratedCourse {
  title: string;
  description: string;
  category: string;
  icon: string;
  chapters: {
    title: string;
    subtopics: {
      title: string;
      content: string;
      quiz: {
        question: string;
        options: string[];
        correctAnswer: string;
      };
    }[];
  }[];
}

export async function generateCourseContent(
  topic: string,
  difficulty: string,
): Promise<GeneratedCourse> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `
    You are an elite educational content architect specializing in gamified learning.
    Generate a comprehensive, high-quality course based on:
    Topic: ${topic}
    Difficulty Level: ${difficulty}
    
    Requirements:
    1. Exactly 8-10 Chapters.
    2. Each Chapter must have exactly 5-6 Subtopics.
    3. Each Subtopic must have:
       - A title.
       - Detailed educational content (2-3 paragraphs, markdown supported).
       - A unique quiz question related to the content.
       - 4 options for the quiz.
       - The correct answer (must match one of the options).
    4. General course metadata: Title, Description, Category, and a Lucide icon name.
    
    The content should be engaging, informative, and reflect the selected difficulty level (${difficulty}).
    
    Return ONLY a valid JSON object with the following structure:
    {
      "title": "Course Title",
      "description": "Engaging description",
      "category": "Education/Programming/etc",
      "icon": "Lucide icon name (e.g., 'book', 'code', 'cpu')",
      "chapters": [
        {
          "title": "Chapter Title",
          "subtopics": [
            {
              "title": "Subtopic Title",
              "content": "Detailed educational content here...",
              "quiz": {
                "question": "Question text?",
                "options": ["Op 1", "Op 2", "Op 3", "Op 4"],
                "correctAnswer": "Op 1"
              }
            }
          ]
        }
      ]
    }
    
    CRITICAL: Ensure the JSON is perfectly valid and complete. Do not truncate.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("Failed to parse Gemini response");
  } catch (error) {
    console.error("Error generating course:", error);
    throw error;
  }
}

export async function generateCourseBannerImage(
  title: string,
  category: string,
): Promise<string | null> {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
    });
    const prompt = `A vibrant, ultra-bold, gamified course banner image for a "${title}" course about ${category}.

BOLD GLOWING TITLE TEXT: Display "${title}" in MASSIVE bold letters dead center — rendered in fiery yellow-to-orange gradient with thick white outline, electric glow, and slight 3D extrusion effect. The text must be the dominant focal point.

3D MASCOT CHARACTER: A cute, expressive, Pixar-style 3D cartoon mascot relevant to ${category} (e.g., a robot for AI, snake for Python, glowing wizard for magic/data). Big eyes, dynamic action pose, surrounded by a radiant aura.

GAMIFICATION ELEMENTS: Floating XP badge (+500 XP), shiny gold coins, glowing gems, treasure chest bursting open, level-up progress bar (almost full), golden achievement medal, neon lightning bolts, and a flaming rocket launching upward.

LEARNING CONTEXT: A glowing laptop displaying colorful code snippets, floating holographic UI panels showing course progress.

BACKGROUND: Deep royal blue to electric purple gradient with bokeh particles, neon sparkles, colorful confetti explosions, game HUD overlay borders, and cinematic lens flare.

COLOR PALETTE: Yellow+Orange title, Blue+Purple background, Neon Green+Cyan+Hot Pink accents, Gold rewards.

COMPOSITION (widescreen 16:9 banner): Left side — mascot character with laptop. Center — MASSIVE course title text. Right side — XP badge, coins, treasure chest, achievement badge.

STYLE: Hyper-realistic 3D render, Unreal Engine 5, cinematic lighting, subsurface scattering, ultra-sharp focus, 8K resolution, movie poster quality, extreme contrast and saturation, YouTube gaming thumbnail aesthetic.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      config: {
        responseModalities: ["IMAGE"],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const inlineData =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData && inlineData.data) {
      const mimeType = inlineData.mimeType || "image/png";
      return `data:${mimeType};base64,${inlineData.data}`;
    }
  } catch (error) {
    console.error("Error generating image banner:", error);
  }
  return null;
}
