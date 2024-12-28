import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ArtAnalysis {
  style: {
    current: string;
    influences: string[];
    similarArtists: string[];
  };
  composition: {
    structure: string;
    balance: string;
    colorTheory: string;
    perspective: string;
  };
  technique: {
    medium: string;
    execution: string;
    skillLevel: string;
  };
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  technicalSuggestions: string[];
}

export async function analyzeArtwork(
  imageBase64: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    const prompt = `As an expert art critic and educator, analyze this artwork in detail. ${
      goals ? `The artist's goals are: ${goals}` : ""
    }

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "style": {
    "current": "Main artistic style",
    "influences": ["List of artistic influences"],
    "similarArtists": ["Artists with similar styles"]
  },
  "composition": {
    "structure": "Analysis of compositional structure",
    "balance": "Assessment of visual balance",
    "colorTheory": "Color usage and harmony analysis",
    "perspective": "Evaluation of perspective and depth"
  },
  "technique": {
    "medium": "Identified medium and materials",
    "execution": "Technical execution assessment",
    "skillLevel": "Current skill level evaluation"
  },
  "strengths": ["3-5 key strengths"],
  "improvements": ["3-5 suggested improvements"],
  "detailedFeedback": "Comprehensive feedback incorporating goals",
  "technicalSuggestions": ["Specific technical recommendations"]
}

Focus on being constructive and specific in your feedback. Include references to art principles and techniques where relevant.`;

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