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
    const prompt = `As an expert art critic and educator, provide a comprehensive analysis of "${title}". ${
      goals ? `Consider the artist's goals: ${goals}` : ""
    }

Please provide a detailed analysis in JSON format with the following structure:
{
  "style": {
    "current": "Primary artistic style",
    "influences": ["Notable artistic influences"],
    "similarArtists": ["Artists with comparable styles"],
    "period": "Historical or contemporary period",
    "movement": "Associated art movement"
  },
  "composition": {
    "structure": "Detailed analysis of compositional structure",
    "balance": "Assessment of visual weight and balance",
    "colorTheory": "Analysis of color harmony and relationships",
    "perspective": "Evaluation of depth and spatial relationships",
    "focusPoints": ["Key areas that draw attention"],
    "dynamicElements": ["Elements creating movement or flow"]
  },
  "technique": {
    "medium": "Identified materials and tools",
    "execution": "Technical proficiency assessment",
    "skillLevel": "Current skill evaluation",
    "uniqueApproaches": ["Notable technical choices"],
    "materialUsage": "How materials were applied"
  },
  "strengths": ["3-5 notable achievements in '${title}'"],
  "improvements": ["3-5 areas for growth specific to '${title}'"],
  "detailedFeedback": "Comprehensive analysis incorporating goals and artwork title",
  "technicalSuggestions": ["Specific technique improvements for this piece"],
  "learningResources": ["Recommended tutorials, books, or courses"]
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
    const prompt = `As an art expert, compare these two artworks and analyze their stylistic relationship. 
The first image is "${currentTitle}", and the second is "${previousTitle}".

Please provide a detailed comparison in JSON format with the following structure:
{
  "similarities": ["List specific stylistic elements that appear in both '${currentTitle}' and '${previousTitle}'"],
  "differences": ["Note key stylistic changes between '${currentTitle}' and '${previousTitle}'"],
  "evolution": {
    "improvements": ["Areas showing clear progress in '${currentTitle}' compared to '${previousTitle}'"],
    "consistentStrengths": ["Strong elements maintained across both works"],
    "newTechniques": ["New artistic approaches or techniques introduced in '${currentTitle}'"]
  },
  "recommendations": ["Specific suggestions for further development based on the observed progression between these two pieces"]
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