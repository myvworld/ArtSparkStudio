import OpenAI from "openai";
import type { ArtAnalysis } from "./types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
let openai: OpenAI;
try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log("OpenAI client initialized successfully");
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
  process.exit(1);
}

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  console.log(`Starting artwork analysis for "${title}"`);

  try {
    // Validate inputs
    if (!imageBase64) {
      console.error("No image data provided for analysis");
      throw new Error("Image data is required");
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key is missing - returning mock analysis");
      return getMockAnalysis("Service Temporarily Unavailable");
    }

    console.log("Preparing OpenAI request with image and prompt");
    const prompt = `As an expert art critic and educator, analyze this artwork titled "${title}" ${
      goals ? `with the artist's goals: ${goals}. ` : '. '
    }Provide a comprehensive analysis in JSON format, including a detailed assessment of:
    - Style (current style, influences, artistic movement)
    - Composition (structure, balance, color theory)
    - Technique (medium, execution, skill level)
    - Strengths and areas for improvement
    - Specific technical suggestions and learning resources`;

    console.log("Sending request to OpenAI API");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0]?.message?.content) {
      console.error("Empty response from OpenAI");
      throw new Error("Empty response from OpenAI");
    }

    console.log("Successfully received OpenAI response");
    const rawResponse = response.choices[0].message.content;
    console.log("Raw OpenAI response:", rawResponse);

    const analysis = JSON.parse(rawResponse);
    console.log("Parsed analysis:", analysis);

    return {
      style: {
        current: analysis.style?.current || "Style analysis unavailable",
        influences: analysis.style?.influences || [],
        similarArtists: analysis.style?.similarArtists || [],
        period: analysis.style?.period || "Period unknown",
        movement: analysis.style?.movement || "Movement unknown"
      },
      composition: {
        structure: analysis.composition?.structure || "Composition analysis unavailable",
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
      learningResources: analysis.learningResources || []
    };
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack
    });

    return getMockAnalysis("Error Processing");
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