
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
