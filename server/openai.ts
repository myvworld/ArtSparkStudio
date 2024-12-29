import OpenAI from "openai";
import type { ArtAnalysis } from "./types";

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
    }Provide a comprehensive analysis in JSON format, including:
    {
      "style": {
        "current": "string",
        "influences": ["string"],
        "period": "string",
        "movement": "string"
      },
      "composition": {
        "structure": "string",
        "balance": "string",
        "colorTheory": "string",
        "focusPoints": ["string"]
      },
      "technique": {
        "medium": "string",
        "execution": "string",
        "skillLevel": "string",
        "uniqueApproaches": ["string"]
      },
      "strengths": ["string"],
      "improvements": ["string"],
      "detailedFeedback": "string",
      "learningResources": ["string"]
    }`;

    console.log("Sending request to OpenAI API");
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
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
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!response.choices[0]?.message?.content) {
      console.error("Empty response from OpenAI");
      throw new Error("Empty response from OpenAI");
    }

    console.log("Successfully received OpenAI response");
    const rawResponse = response.choices[0].message.content;
    console.log("Raw OpenAI response length:", rawResponse.length);

    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
      console.log("Successfully parsed OpenAI response");
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response was:", rawResponse);
      throw new Error("Failed to parse OpenAI response");
    }

    // Validate the analysis structure
    if (!analysis.style || !analysis.composition || !analysis.technique) {
      console.error("Invalid analysis structure:", analysis);
      throw new Error("Invalid analysis structure from OpenAI");
    }

    console.log("Returning formatted analysis");
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
  } catch (error) {
    const err = error as Error;
    console.error("Artwork analysis failed:", {
      message: err.message,
      stack: err.stack
    });

    if (err.message.includes("OpenAI API error")) {
      console.log("OpenAI API error - returning mock analysis");
      return getMockAnalysis("API Error");
    }

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