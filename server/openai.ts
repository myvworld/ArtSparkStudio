import OpenAI from "openai";
import type { ArtAnalysis } from "./types";

// Validate API key and initialize OpenAI client with better error handling
function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable is not set");
    throw new Error("OpenAI API key not configured");
  }

  try {
    return new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 30000
    });
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", error);
    throw error;
  }
}

let openai: OpenAI;
try {
  openai = initializeOpenAI();
  console.log("OpenAI client initialized successfully");
} catch (error) {
  console.error("Failed to initialize OpenAI:", error);
  throw error;
}

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    console.log(`Starting artwork analysis for "${title}"`);

    if (!imageBase64) {
      throw new Error("No image data provided for analysis");
    }

    // Clean and validate the base64 string
    const base64Image = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    if (!base64Image || !isValidBase64(base64Image)) {
      throw new Error("Invalid image data format");
    }

    console.log("Preparing OpenAI request for image analysis", {
      title,
      hasGoals: !!goals,
      imageSize: base64Image.length
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert art critic and educator. Analyze the artwork and provide detailed feedback in a structured JSON format including style, composition, technique, strengths, improvements, and technical suggestions."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this artwork titled "${title}"${goals ? ` with the artist's goals: ${goals}` : ''}. Provide a comprehensive analysis including style, composition, technique, strengths, and areas for improvement. Include specific technical suggestions for improvement.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error("Empty response from OpenAI");
    }

    console.log("Successfully received OpenAI response");
    const analysis = JSON.parse(response.choices[0].message.content);

    return {
      style: {
        current: analysis.style?.current || "Style analysis unavailable",
        influences: analysis.style?.influences || [],
        similarArtists: analysis.style?.similarArtists || [],
        period: analysis.style?.period || "Period unknown",
        movement: analysis.style?.movement || "Movement unknown"
      },
      composition: {
        structure: analysis.composition?.structure || "Structure analysis unavailable",
        balance: analysis.composition?.balance || "Balance analysis unavailable",
        colorTheory: analysis.composition?.colorTheory || "Color theory analysis unavailable",
        perspective: analysis.composition?.perspective || "Perspective analysis unavailable",
        focusPoints: analysis.composition?.focusPoints || [],
        dynamicElements: analysis.composition?.dynamicElements || []
      },
      technique: {
        medium: analysis.technique?.medium || "Medium analysis unavailable",
        execution: analysis.technique?.execution || "Execution analysis unavailable",
        skillLevel: analysis.technique?.skillLevel || "Skill level analysis unavailable",
        uniqueApproaches: analysis.technique?.uniqueApproaches || [],
        materialUsage: analysis.technique?.materialUsage || "Material usage analysis unavailable"
      },
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      detailedFeedback: analysis.detailedFeedback || "Detailed feedback unavailable",
      technicalSuggestions: analysis.technicalSuggestions || [],
      learningResources: analysis.learningResources || [],
      suggestions: analysis.technicalSuggestions || ["No specific suggestions available"]
    };
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack,
      title,
      hasGoals: !!goals
    });

    return getMockAnalysis("Analysis Failed - Service Error");
  }
}

function getMockAnalysis(status: string): ArtAnalysis {
  return {
    style: {
      current: status,
      influences: ["Service Error"],
      similarArtists: [],
      period: status,
      movement: status
    },
    composition: {
      structure: status,
      balance: status,
      colorTheory: status,
      perspective: status,
      focusPoints: [],
      dynamicElements: []
    },
    technique: {
      medium: status,
      execution: status,
      skillLevel: status,
      uniqueApproaches: [],
      materialUsage: status
    },
    strengths: [],
    improvements: [],
    detailedFeedback: "We encountered an error while analyzing your artwork. Please try again later.",
    technicalSuggestions: ["Service temporarily unavailable"],
    learningResources: [],
    suggestions: ["Service temporarily unavailable"]
  };
}

// Helper function to validate base64 string
function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}