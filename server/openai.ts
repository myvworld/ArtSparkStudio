import OpenAI from "openai";
import type { ArtAnalysis } from "./types";

let openai: OpenAI | null = null;

export async function initializeOpenAI(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  try {
    console.log("Creating OpenAI client...");
    openai = new OpenAI({ 
      apiKey,
      maxRetries: 3,
      timeout: 30000
    });

    // Verify the client works with a simple request
    const verifyResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: "API test" }],
      max_tokens: 5
    });

    console.log("OpenAI verification response:", {
      success: !!verifyResponse,
      hasChoices: !!verifyResponse?.choices?.length,
      firstChoice: verifyResponse?.choices?.[0]?.message?.content
    });

    if (!verifyResponse) {
      throw new Error("Failed to verify OpenAI client");
    }

    console.log("OpenAI client verified and initialized successfully");
  } catch (error) {
    console.error("Failed to initialize OpenAI client:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

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
      return null;
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

    const base64Image = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    if (!base64Image || !isValidBase64(base64Image)) {
      console.error('Invalid base64 image data');
      throw new Error("Invalid image data format");
    }

    console.log("Preparing OpenAI request with valid image data");

    const systemPrompt = `You are an expert art critic and educator specializing in visual arts analysis. Analyze the artwork and provide structured feedback in the following JSON format. Be thorough and specific in your analysis:

{
  "style": {
    "current": "Describe the artwork's current style",
    "influences": ["List significant artistic influences"],
    "similarArtists": ["Name similar artists"],
    "period": "Art historical period if applicable",
    "movement": "Art movement if applicable"
  },
  "composition": {
    "structure": "Analysis of compositional structure",
    "balance": "Analysis of visual balance",
    "colorTheory": "Analysis of color usage and theory",
    "perspective": "Analysis of perspective/depth",
    "focusPoints": ["List key focal points"],
    "dynamicElements": ["List dynamic compositional elements"]
  },
  "technique": {
    "medium": "Identify the medium used",
    "execution": "Analyze technical execution",
    "skillLevel": "Beginner/Intermediate/Advanced",
    "uniqueApproaches": ["List unique technical approaches"],
    "materialUsage": "Analyze material handling"
  },
  "strengths": ["List specific artistic strengths"],
  "improvements": ["List specific areas for improvement"],
  "detailedFeedback": "Comprehensive analysis and recommendations",
  "technicalSuggestions": ["Specific technical improvement suggestions"],
  "learningResources": ["Recommended resources for improvement"]
}`;

    console.log("Sending analysis request to GPT-4-Turbo...");
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
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
              text: `Analyze this artwork titled "${title}"${goals ? ` with the artist's goals: ${goals}` : ''}. Provide a comprehensive analysis focusing on technique, composition, and specific areas for improvement.`
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
      console.error('Invalid API response:', JSON.stringify(response, null, 2));
      throw new Error("Invalid response format from OpenAI API");
    }

    console.log("Successfully received OpenAI response");
    console.log("Raw API response:", response.choices[0].message.content);

    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      console.log("Successfully parsed OpenAI response into JSON", {
        hasStyle: !!parsedResponse.style,
        hasComposition: !!parsedResponse.composition,
        hasTechnique: !!parsedResponse.technique,
        responseStructure: Object.keys(parsedResponse)
      });

      // Ensure we return a properly formatted analysis object
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
          skillLevel: (parsedResponse.technique?.skillLevel === "Advanced" ? "Advanced" :
                      parsedResponse.technique?.skillLevel === "Intermediate" ? "Intermediate" : "Beginner"),
          uniqueApproaches: Array.isArray(parsedResponse.technique?.uniqueApproaches) ? parsedResponse.technique.uniqueApproaches : [],
          materialUsage: parsedResponse.technique?.materialUsage || "Material usage analysis unavailable"
        },
        strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths : [],
        improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements : [],
        detailedFeedback: parsedResponse.detailedFeedback || "Detailed feedback unavailable",
        technicalSuggestions: Array.isArray(parsedResponse.technicalSuggestions) ? parsedResponse.technicalSuggestions : [],
        learningResources: Array.isArray(parsedResponse.learningResources) ? parsedResponse.learningResources : [],
        suggestions: Array.isArray(parsedResponse.technicalSuggestions) ? parsedResponse.technicalSuggestions : ["Upload your next artwork to see how your style evolves!"]
      };

      console.log("Analysis structured successfully:", {
        hasStyle: !!analysis.style,
        hasComposition: !!analysis.composition,
        hasTechnique: !!analysis.technique,
        suggestionsCount: analysis.suggestions.length,
        analysisJson: JSON.stringify(analysis)
      });

      return analysis;
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error, "\nResponse was:", response.choices[0].message.content);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error) {
    console.error("Artwork analysis failed:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      title,
      hasGoals: !!goals
    });
    return null;
  }
}