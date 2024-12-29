import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StyleComparison {
  similarities: string[];
  differences: string[];
  evolution: {
    improvements: string[];
    consistentStrengths: string[];
    newTechniques: string[];
  };
  recommendations: string[];
}

export interface ArtAnalysis {
  style: {
    current: string;
    influences: string[];
    similarArtists: string[];
    period: string;
    movement: string;
  };
  composition: {
    structure: string;
    balance: string;
    colorTheory: string;
    perspective: string;
    focusPoints: string[];
    dynamicElements: string[];
  };
  technique: {
    medium: string;
    execution: string;
    skillLevel: string;
    uniqueApproaches: string[];
    materialUsage: string;
  };
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  technicalSuggestions: string[];
  learningResources: string[];
}

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    const prompt = `As an expert art critic and educator, provide a comprehensive analysis of this artwork titled "${title}". ${
      goals ? `The artist's goals for "${title}" are: ${goals}.` : ""
    }

Please provide a detailed analysis in JSON format, making specific references to "${title}" where appropriate, with the following structure:
{
  "style": {
    "current": "Primary artistic style demonstrated in '${title}'",
    "influences": ["Notable artistic influences visible in this work"],
    "similarArtists": ["Artists whose style resonates with '${title}'"],
    "period": "Historical or contemporary period this piece reflects",
    "movement": "Associated art movement"
  },
  "composition": {
    "structure": "Detailed analysis of '${title}'s' compositional structure",
    "balance": "Assessment of visual weight and balance in the piece",
    "colorTheory": "Analysis of color harmony and relationships used",
    "perspective": "Evaluation of depth and spatial relationships",
    "focusPoints": ["Key areas that draw attention in '${title}'"],
    "dynamicElements": ["Elements creating movement or flow"]
  },
  "technique": {
    "medium": "Materials and tools used in '${title}'",
    "execution": "Technical proficiency assessment",
    "skillLevel": "Current skill level demonstrated",
    "uniqueApproaches": ["Notable technical choices in '${title}'"],
    "materialUsage": "How materials were applied in this piece"
  },
  "strengths": ["3-5 notable achievements in '${title}'"],
  "improvements": ["3-5 specific areas where '${title}' could be enhanced"],
  "detailedFeedback": "Comprehensive analysis incorporating the goals and specific elements of '${title}'",
  "technicalSuggestions": ["Specific technique improvements for '${title}'"],
  "learningResources": ["Recommended tutorials, books, or courses relevant to improving aspects of '${title}'"]
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
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}") as ArtAnalysis;
    console.log("Analysis completed successfully");
    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze artwork");
  }
}

export async function compareArtworkStyles(
  currentImageBase64: string,
  previousImageBase64: string,
  currentTitle: string,
  previousTitle: string
): Promise<StyleComparison> {
  try {
    const prompt = `As an art expert, provide a personalized comparison between these two artworks: "${currentTitle}" (the newer piece) and "${previousTitle}" (the previous work).

Please provide a detailed comparison in JSON format that specifically references both artworks by name where appropriate:
{
  "similarities": ["List specific stylistic elements that appear in both '${currentTitle}' and '${previousTitle}'"],
  "differences": ["Note how '${currentTitle}' differs from '${previousTitle}' in terms of style and execution"],
  "evolution": {
    "improvements": ["Areas where '${currentTitle}' shows clear progress compared to '${previousTitle}'"],
    "consistentStrengths": ["Strong elements maintained from '${previousTitle}' to '${currentTitle}'"],
    "newTechniques": ["New artistic approaches or techniques introduced in '${currentTitle}' that weren't present in '${previousTitle}'"]
  },
  "recommendations": ["Specific suggestions for further development, based on the progress shown between '${previousTitle}' and '${currentTitle}'"]
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
                url: `data:image/jpeg;base64,${currentImageBase64}`,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${previousImageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}") as StyleComparison;
    console.log("Style comparison completed successfully");
    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to compare artworks");
  }
}