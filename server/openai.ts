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
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing");
      throw new Error("OpenAI configuration error");
    }

    const prompt = `As an expert art critic and educator, analyze this artwork titled "${title}" and provide feedback in a structured JSON format. Include detailed analysis of style, composition, technique, and specific improvements. ${
      goals ? `The artist's goals for "${title}" are: ${goals}.` : ""
    }`;

    console.log("Sending request to OpenAI API with model: gpt-4o");

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

    if (!response.choices[0].message.content) {
      console.error("Empty response from OpenAI");
      throw new Error("Invalid response from AI service");
    }

    console.log("Successfully received OpenAI response");
    const analysis = JSON.parse(response.choices[0].message.content);
    return analysis;
  } catch (error: any) {
    console.error("OpenAI API error details:", {
      status: error.status,
      message: error.message,
      type: error.type,
      stack: error.stack
    });

    // Provide more specific error messages
    if (error.status === 401) {
      throw new Error("OpenAI API key is invalid or expired");
    } else if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later");
    } else if (error.status === 500) {
      throw new Error("OpenAI service is currently experiencing issues");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error("Network connectivity issue while contacting OpenAI");
    }

    // Check if error is a JSON parsing error
    if (error instanceof SyntaxError) {
      console.error("JSON parsing error:", error);
      throw new Error("Failed to parse AI response");
    }

    throw new Error(error.message || "Failed to analyze artwork");
  }
}