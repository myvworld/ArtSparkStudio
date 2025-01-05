import OpenAI from "openai";
import type { ArtAnalysis } from "./types";

let openai: OpenAI | null = null;

// Validate API key and initialize OpenAI client with better error handling
export async function initializeOpenAI(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set");
    throw new Error("OpenAI API key not configured");
  }

  console.log("OpenAI API key verification:", {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 3),
    isValid: apiKey.startsWith('sk-')
  });

  try {
    console.log("Creating OpenAI client...");
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 30000
    });

    // Verify the API key by making a simple API call
    console.log("Verifying OpenAI API key...");
    const testResponse = await client.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{ role: "system", content: "API key verification test" }],
      max_tokens: 5
    });

    if (!testResponse) {
      throw new Error("Failed to get response from OpenAI");
    }

    openai = client;
    console.log("OpenAI client initialized and API key verified successfully");
  } catch (error: any) {
    console.error("Failed to initialize OpenAI client:", {
      error: error.message,
      status: error.response?.status,
      stack: error.stack
    });

    if (error.response?.status === 401) {
      throw new Error("Invalid OpenAI API key");
    }
    throw error;
  }
}

// Helper function to validate base64 string
function isValidBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
}

export async function analyzeArtwork(
  imageBase64: string,
  title: string,
  goals?: string
): Promise<ArtAnalysis> {
  try {
    if (!openai) {
      console.error("OpenAI client not initialized");
      throw new Error("OpenAI service not available");
    }

    console.log(`Starting artwork analysis for "${title}"`);
    console.log('Analysis parameters:', {
      hasTitle: !!title,
      hasGoals: !!goals,
      imageSize: imageBase64?.length || 0
    });

    if (!imageBase64) {
      throw new Error("No image data provided for analysis");
    }

    // Clean and validate the base64 string
    const base64Image = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    if (!base64Image || !isValidBase64(base64Image)) {
      console.error('Invalid base64 image data');
      throw new Error("Invalid image data format");
    }

    console.log('Image validated and ready for analysis:', {
      base64Length: base64Image.length,
      isValid: isValidBase64(base64Image)
    });

    const systemPrompt = `You are an expert art critic and educator. Analyze the artwork and provide detailed feedback in the following JSON format:
{
  "style": {
    "current": "Brief description of current style",
    "influences": ["List of artistic influences"],
    "similarArtists": ["List of similar artists"],
    "period": "Art historical period",
    "movement": "Art movement"
  },
  "composition": {
    "structure": "Analysis of compositional structure",
    "balance": "Analysis of visual balance",
    "colorTheory": "Analysis of color usage",
    "perspective": "Analysis of perspective",
    "focusPoints": ["List of focal points"],
    "dynamicElements": ["List of dynamic elements"]
  },
  "technique": {
    "medium": "Identified medium used",
    "execution": "Analysis of technical execution",
    "skillLevel": "Beginner/Intermediate/Advanced",
    "uniqueApproaches": ["List of unique technical approaches"],
    "materialUsage": "Analysis of material handling"
  },
  "strengths": ["List of artistic strengths"],
  "improvements": ["Areas for improvement"],
  "detailedFeedback": "Comprehensive analysis",
  "technicalSuggestions": ["Specific technical suggestions"],
  "learningResources": ["Recommended learning resources"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this artwork titled "${title}"${goals ? ` with the artist's goals: ${goals}` : ''}. Provide a comprehensive analysis including style, composition, technique, strengths, and areas for improvement. Focus on concrete, actionable feedback.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Validate API response
    if (!response.choices?.[0]?.message?.content) {
      console.error('Invalid API response:', response);
      throw new Error("Invalid response format from OpenAI API");
    }

    console.log("Successfully received OpenAI response");
    let analysis: ArtAnalysis;
    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);

      // Structure the response to match our ArtAnalysis type
      analysis = {
        style: {
          current: parsedResponse.style?.current || "Style analysis unavailable",
          influences: parsedResponse.style?.influences || [],
          similarArtists: parsedResponse.style?.similarArtists || [],
          period: parsedResponse.style?.period || "Period unknown",
          movement: parsedResponse.style?.movement || "Movement unknown"
        },
        composition: {
          structure: parsedResponse.composition?.structure || "Structure analysis unavailable",
          balance: parsedResponse.composition?.balance || "Balance analysis unavailable",
          colorTheory: parsedResponse.composition?.colorTheory || "Color theory analysis unavailable",
          perspective: parsedResponse.composition?.perspective || "Perspective analysis unavailable",
          focusPoints: parsedResponse.composition?.focusPoints || [],
          dynamicElements: parsedResponse.composition?.dynamicElements || []
        },
        technique: {
          medium: parsedResponse.technique?.medium || "Medium analysis unavailable",
          execution: parsedResponse.technique?.execution || "Execution analysis unavailable",
          skillLevel: parsedResponse.technique?.skillLevel || "Skill level analysis unavailable",
          uniqueApproaches: parsedResponse.technique?.uniqueApproaches || [],
          materialUsage: parsedResponse.technique?.materialUsage || "Material usage analysis unavailable"
        },
        strengths: parsedResponse.strengths || [],
        improvements: parsedResponse.improvements || [],
        detailedFeedback: parsedResponse.detailedFeedback || "Detailed feedback unavailable",
        technicalSuggestions: parsedResponse.technicalSuggestions || [],
        learningResources: parsedResponse.learningResources || []
      };
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from OpenAI");
    }

    console.log("Analysis structured successfully");
    return analysis;
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack,
      title,
      hasGoals: !!goals
    });
    throw error;
  }
}