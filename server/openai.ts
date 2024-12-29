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
      console.error("OpenAI API key is missing");
      // Return a mock analysis when API key is missing
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
        strengths: ["Service is being configured"],
        improvements: ["Please try again later"],
        detailedFeedback: "The artwork analysis service is currently unavailable. Please try again later.",
        learningResources: ["Service will be available soon"]
      };
    }

    if (!imageBase64) {
      console.error("No image data provided for analysis");
      throw new Error("Image data is required");
    }

    const prompt = `As an expert art critic and educator, analyze this artwork titled "${title}" and provide feedback in a structured JSON format. Include detailed analysis of style, composition, technique, and specific improvements. ${
      goals ? `The artist's goals for "${title}" are: ${goals}.` : ""
    }`;

    console.log("Sending request to OpenAI API with model: gpt-4o");

    try {
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
        console.error("Empty or invalid response from OpenAI");
        throw new Error("Invalid response from AI service");
      }

      console.log("Successfully received OpenAI response");

      try {
        const analysis = JSON.parse(response.choices[0].message.content);
        return analysis;
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        throw new Error("Failed to parse AI response");
      }

    } catch (apiError: any) {
      console.error("OpenAI API call failed:", {
        status: apiError.status,
        message: apiError.message,
        type: apiError.type,
        stack: apiError.stack
      });

      if (apiError.status === 401) {
        throw new Error("OpenAI API key is invalid or expired");
      } else if (apiError.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later");
      } else if (apiError.status === 500) {
        throw new Error("OpenAI service is currently experiencing issues");
      } else if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ENOTFOUND') {
        throw new Error("Network connectivity issue while contacting OpenAI");
      }

      throw new Error(apiError.message || "Failed to get AI analysis");
    }
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack
    });

    // Return a graceful fallback response
    return {
      style: {
        current: "Analysis Error",
        influences: ["Service Error"]
      },
      composition: {
        structure: "Error Processing",
        balance: "Please try again",
        colorTheory: "Service error occurred"
      },
      technique: {
        medium: "Error",
        execution: "Unable to process",
        skillLevel: "Try again later"
      },
      strengths: ["Service encountered an error"],
      improvements: ["Please try uploading again"],
      detailedFeedback: "We encountered an error while analyzing your artwork. Please try again later.",
      learningResources: ["Service will be back shortly"]
    };
  }
}