import OpenAI from "openai";
import type { ArtAnalysis, StyleComparison } from "./types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  console.log(`Starting artwork analysis for "${title}"`);

  try {
    // Check for OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key is missing - returning mock analysis");
      return {
        style: {
          current: "Analysis Unavailable",
          influences: ["Service Temporarily Unavailable"]
        },
        composition: {
          structure: "Analysis Pending",
          balance: "Please try again later",
          colorTheory: "Service configuration required"
        },
        technique: {
          medium: "Pending Analysis",
          execution: "Service temporarily unavailable",
          skillLevel: "Unable to analyze"
        },
        strengths: [],
        improvements: [],
        detailedFeedback: "The artwork analysis service is currently unavailable. Please try again later."
      };
    }

    console.log("Preparing OpenAI request with image and prompt");
    const prompt = `As an expert art critic and educator, analyze this artwork titled "${title}" ${
      goals ? `with the artist's goals: ${goals}. ` : '. '
    }Provide a detailed analysis in JSON format with the following structure:
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
        "colorTheory": "string"
      },
      "technique": {
        "medium": "string",
        "execution": "string",
        "skillLevel": "string"
      },
      "strengths": ["string"],
      "improvements": ["string"],
      "detailedFeedback": "string"
    }`;

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
      throw new Error("Empty response from OpenAI");
    }

    console.log("Successfully received OpenAI response");
    const analysis = JSON.parse(response.choices[0].message.content);

    // Ensure the response matches our schema structure
    return {
      style: {
        current: analysis.style?.current || "Style analysis unavailable",
        influences: analysis.style?.influences || [],
        period: analysis.style?.period,
        movement: analysis.style?.movement
      },
      composition: {
        structure: analysis.composition?.structure || "Composition analysis unavailable",
        balance: analysis.composition?.balance || "Balance analysis unavailable",
        colorTheory: analysis.composition?.colorTheory || "Color theory analysis unavailable"
      },
      technique: {
        medium: analysis.technique?.medium || "Medium analysis unavailable",
        execution: analysis.technique?.execution || "Execution analysis unavailable",
        skillLevel: analysis.technique?.skillLevel || "Skill level analysis unavailable"
      },
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      detailedFeedback: analysis.detailedFeedback || "Detailed feedback unavailable"
    };
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack
    });

    // Return a graceful error response that matches our schema
    return {
      style: {
        current: "Error Processing",
        influences: ["Service Error"]
      },
      composition: {
        structure: "Error Processing",
        balance: "Error Processing",
        colorTheory: "Error Processing"
      },
      technique: {
        medium: "Error Processing",
        execution: "Error Processing",
        skillLevel: "Error Processing"
      },
      strengths: [],
      improvements: [],
      detailedFeedback: "We encountered an error while analyzing your artwork. Please try again later."
    };
  }
}