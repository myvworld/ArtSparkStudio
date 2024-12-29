import OpenAI from "openai";
import type { ArtAnalysis, StyleComparison } from "./types";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    const prompt = `As an expert art critic and educator, analyze this artwork titled "${title}" and provide feedback in a structured JSON format. Include detailed analysis of style, composition, technique, and specific improvements. ${
      goals ? `The artist's goals for "${title}" are: ${goals}.` : ""
    }`;

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

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return analysis;
  } catch (error: any) {
    console.error("OpenAI API error:", error);

    // Provide more specific error messages
    if (error.status === 401) {
      throw new Error("OpenAI API key is invalid or expired");
    } else if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later");
    } else if (error.status === 500) {
      throw new Error("OpenAI service is currently experiencing issues");
    }

    throw new Error(error.message || "Failed to analyze artwork");
  }
}