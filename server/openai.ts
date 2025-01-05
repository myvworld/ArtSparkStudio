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

    // Test with a simple text completion
    console.log("Verifying OpenAI API key with text model...");
    const testResponse = await client.chat.completions.create({
      model: "gpt-4-1106-preview",
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
): Promise<ArtAnalysis | null> {
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

    const systemPrompt = `You are an expert art critic and educator. Analyze the artwork and provide detailed feedback in JSON format. Include comprehensive analysis of style, composition, technique, strengths, and areas for improvement. Format your response as follows:

{
  "style": {
    "current": "Brief description of current style",
    "influences": ["List of artistic influences"],
    "similarArtists": ["List of similar artists"],
    "period": "Art historical period if applicable",
    "movement": "Art movement if applicable"
  },
  "composition": {
    "structure": "Analysis of compositional structure",
    "balance": "Analysis of visual balance",
    "colorTheory": "Analysis of color usage",
    "perspective": "Analysis of perspective/depth if applicable",
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

    console.log("Sending analysis request to GPT-4 Vision...");
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

    if (!response.choices?.[0]?.message?.content) {
      console.error('Invalid API response:', response);
      throw new Error("Invalid response format from OpenAI API");
    }

    console.log("Successfully received OpenAI response");

    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      console.log("Successfully parsed OpenAI response into JSON");

      // Structure the response to match our ArtAnalysis type with proper type safety
      const analysis: ArtAnalysis = {
        style: {
          current: parsedResponse.style?.current || "Style analysis unavailable",
          influences: Array.isArray(parsedResponse.style?.influences) ? parsedResponse.style.influences : [],
          similarArtists: Array.isArray(parsedResponse.style?.similarArtists) ? parsedResponse.style.similarArtists : [],
          period: parsedResponse.style?.period || undefined,
          movement: parsedResponse.style?.movement || undefined
        },
        composition: {
          structure: parsedResponse.composition?.structure || "Structure analysis unavailable",
          balance: parsedResponse.composition?.balance || "Balance analysis unavailable",
          colorTheory: parsedResponse.composition?.colorTheory || "Color theory analysis unavailable",
          perspective: parsedResponse.composition?.perspective || undefined,
          focusPoints: Array.isArray(parsedResponse.composition?.focusPoints) ? parsedResponse.composition.focusPoints : [],
          dynamicElements: Array.isArray(parsedResponse.composition?.dynamicElements) ? parsedResponse.composition.dynamicElements : []
        },
        technique: {
          medium: parsedResponse.technique?.medium || "Medium analysis unavailable",
          execution: parsedResponse.technique?.execution || "Execution analysis unavailable",
          skillLevel: parsedResponse.technique?.skillLevel || "Skill level analysis unavailable",
          uniqueApproaches: Array.isArray(parsedResponse.technique?.uniqueApproaches) ? parsedResponse.technique.uniqueApproaches : [],
          materialUsage: parsedResponse.technique?.materialUsage || "Material usage analysis unavailable"
        },
        strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths : [],
        improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements : [],
        detailedFeedback: parsedResponse.detailedFeedback || "Detailed feedback unavailable",
        technicalSuggestions: Array.isArray(parsedResponse.technicalSuggestions) ? parsedResponse.technicalSuggestions : [],
        learningResources: Array.isArray(parsedResponse.learningResources) ? parsedResponse.learningResources : [],
        suggestions: Array.isArray(parsedResponse.technicalSuggestions) ? parsedResponse.technicalSuggestions : ["No specific suggestions available"]
      };

      console.log("Analysis structured successfully:", {
        hasStyle: !!analysis.style,
        hasComposition: !!analysis.composition,
        hasTechnique: !!analysis.technique,
        suggestionsCount: analysis.suggestions.length
      });

      return analysis;
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error: any) {
    console.error("Artwork analysis failed:", {
      error: error.message,
      stack: error.stack,
      title,
      hasGoals: !!goals
    });
    return null;
  }
}