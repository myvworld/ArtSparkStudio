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
      model: "gpt-4-turbo",
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
  if (!str) return false;
  try {
    // Check if string matches base64 pattern
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) return false;
    return btoa(atob(str)) === str;
  } catch (err) {
    console.error('Base64 validation error:', err);
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

    console.log("Preparing OpenAI vision request");

    // Validate request parameters before making API call
    if (!title.trim()) {
      throw new Error("Title is required for analysis");
    }

    const validModel = "gpt-4-turbo-preview";
    console.log('Preparing API request:', {
      model: validModel,
      imageSize: base64Image.length,
      hasGoals: !!goals
    });

    const response = await openai.chat.completions.create({
      model: validModel, //Corrected: Using the updated model in the API call
      messages: [
        {
          role: "system",
          content: "You are an expert art critic and educator. Analyze the artwork and provide detailed feedback formatted as a JSON object that matches the ArtAnalysis interface. Include comprehensive analysis of style, composition, technique, strengths, and areas for improvement."
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
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // Validate API response
    if (!response.choices?.[0]?.message?.content) {
      console.error('Invalid API response:', response);
      throw new Error("Invalid response format from OpenAI API");
    }

    if (!response.choices[0]?.message?.content) {
      console.log("Empty response from OpenAI");
      throw new Error("Empty response from OpenAI");
    }

    console.log("Successfully received OpenAI response");
    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from OpenAI");
    }

    // Ensure the response matches our interface structure
    const structuredAnalysis: ArtAnalysis = {
      style: {
        current: analysis.style?.current || "Style analysis unavailable",
        influences: analysis.style?.influences || [],
        similarArtists: analysis.style?.similarArtists || [],
        period: analysis.style?.period || "Period unknown",
        movement: analysis.style?.movement || "Movement unknown"
      },
      composition: {
        structure: analysis.composition?.structure || "Structure analysis unavailable",
        balance: analysis.composition?.balance || "Balance analysis unavailable",
        colorTheory: analysis.composition?.colorTheory || "Color theory analysis unavailable",
        perspective: analysis.composition?.perspective || "Perspective analysis unavailable",
        focusPoints: analysis.composition?.focusPoints || [],
        dynamicElements: analysis.composition?.dynamicElements || []
      },
      technique: {
        medium: analysis.technique?.medium || "Medium analysis unavailable",
        execution: analysis.technique?.execution || "Execution analysis unavailable",
        skillLevel: analysis.technique?.skillLevel || "Skill level analysis unavailable",
        uniqueApproaches: analysis.technique?.uniqueApproaches || [],
        materialUsage: analysis.technique?.materialUsage || "Material usage analysis unavailable"
      },
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      detailedFeedback: analysis.detailedFeedback || "Detailed feedback unavailable",
      technicalSuggestions: analysis.technicalSuggestions || [],
      learningResources: analysis.learningResources || [],
      suggestions: analysis.suggestions || ["No specific suggestions available"]
    };

    console.log("Analysis structured successfully");
    return structuredAnalysis;
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