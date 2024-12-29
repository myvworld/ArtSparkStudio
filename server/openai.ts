
import OpenAI from "openai";
import type { ArtAnalysis, StyleComparison } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    const prompt = `As an expert art critic and educator, provide a comprehensive analysis of this artwork titled "${title}". ${
      goals ? `The artist's goals for "${title}" are: ${goals}.` : ""
    }`;

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
      max_tokens: 1000,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return analysis;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze artwork");
  }
}
