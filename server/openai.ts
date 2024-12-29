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
    console.log('Analysis parameters:', {
      hasTitle: !!title,
      hasGoals: !!goals,
      imageSize: imageBase64?.length || 0
    });

    if (!imageBase64) {
      throw new Error("No image data provided for analysis");
    }

    // Clean and validate the base64 string
    const base64Image = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    if (!base64Image || !isValidBase64(base64Image)) {
      throw new Error("Invalid image data format");
    }

    console.log("Preparing OpenAI vision request");

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-vision",
      messages: [
        {
          role: "system",
          content: "You are an expert art critic and educator. Analyze the artwork and provide detailed feedback formatted as a JSON object that matches the ArtAnalysis interface. Include comprehensive analysis of style, composition, technique, strengths, and areas for improvement."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this artwork titled "${title}"${goals ? ` with the artist's goals: ${goals}` : ''}. Provide a comprehensive analysis including style, composition, technique, strengths, and areas for improvement. Focus on concrete, actionable feedback.`
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
      console.error("Empty response from OpenAI");
      throw new Error("Empty response from OpenAI");
    }

    console.log("Successfully received OpenAI response");
    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from OpenAI");
    }

    // Ensure the response matches our interface structure
    const structuredAnalysis: ArtAnalysis = {
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
      suggestions: analysis.suggestions || []
    };

    console.log("Analysis structured successfully");
    return structuredAnalysis;
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack,
      title,
      hasGoals: !!goals
    });
    throw error;
  }
}

// Helper function to validate base64 string
function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}