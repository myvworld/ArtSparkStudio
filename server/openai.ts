import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ArtAnalysis {
  style: string;
  composition: string;
  technique: string;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
}

export async function analyzeArtwork(
  imageBase64: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    const prompt = `As an art expert, analyze this artwork in detail. ${
      goals ? `The artist's goals are: ${goals}` : ""
    }

Please provide a structured analysis in JSON format with the following fields:
- style: The artistic style and influences
- composition: Analysis of the composition and visual elements
- technique: Technical aspects of the execution
- strengths: Array of key strengths (3-5 points)
- improvements: Array of suggested improvements (3-5 points)
- detailedFeedback: Comprehensive feedback incorporating the goals

Focus on being constructive and specific in your feedback.`;

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
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content) as ArtAnalysis;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze artwork");
  }
}
