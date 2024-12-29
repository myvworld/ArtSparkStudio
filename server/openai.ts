import OpenAI from "openai";
import type { ArtAnalysis } from "./types";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not set");
  process.exit(1);
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000
});

console.log("OpenAI client initialized successfully");

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

    // Clean the base64 string
    const base64Image = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log("Preparing OpenAI request");
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this artwork titled "${title}"${goals ? ` with the artist's goals: ${goals}` : ''}`
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
        period: analysis.style?.period || "Period unknown",
        movement: analysis.style?.movement || "Movement unknown"
      },
      composition: {
        structure: analysis.composition?.structure || "Structure analysis unavailable",
        balance: analysis.composition?.balance || "Balance analysis unavailable",
        colorTheory: analysis.composition?.colorTheory || "Color theory analysis unavailable",
        focusPoints: analysis.composition?.focusPoints || []
      },
      technique: {
        medium: analysis.technique?.medium || "Medium analysis unavailable",
        execution: analysis.technique?.execution || "Execution analysis unavailable",
        skillLevel: analysis.technique?.skillLevel || "Skill level analysis unavailable",
        uniqueApproaches: analysis.technique?.uniqueApproaches || []
      },
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      detailedFeedback: analysis.detailedFeedback || "Detailed feedback unavailable",
      learningResources: analysis.learningResources || []
    };
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack,
      title,
      hasGoals: !!goals
    });
    throw new Error(`Failed to analyze artwork: ${error.message}`);
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
    technicalSuggestions: [],
    learningResources: []
  };
}