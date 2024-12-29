import { useArtwork } from "@/hooks/use-artwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Palette } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Analytics() {
  const { artworks, isLoading } = useArtwork();

  // Process artworks to extract progress data with proper null checks
  const processedData = artworks?.map(artwork => {
    const feedback = artwork.feedback?.[0];
    const skillLevel = feedback?.analysis?.technique?.skillLevel;

    return {
      date: new Date(artwork.createdAt).toLocaleDateString(),
      technicalScore: skillLevel === 'Advanced' ? 3 :
        skillLevel === 'Intermediate' ? 2 :
        skillLevel === 'Beginner' ? 1 : 0,
      title: artwork.title
    };
  }).filter(data => data.technicalScore > 0) // Only include entries with valid skill levels
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Safely extract improvements and strengths with null checks
  const recentImprovements = artworks?.slice(-2)
    .map(artwork => artwork.styleComparisons?.asCurrent?.[0]?.comparison?.evolution?.improvements)
    .filter(Array.isArray)
    .flat()
    .filter(Boolean) || [];

  const consistentStrengths = artworks?.slice(-2)
    .map(artwork => artwork.styleComparisons?.asCurrent?.[0]?.comparison?.evolution?.consistentStrengths)
    .filter(Array.isArray)
    .flat()
    .filter(Boolean) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Progress Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your artistic growth and development over time
          </p>
        </div>
      </div>

      {!artworks?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Analytics Yet</h2>
            <p className="text-muted-foreground">
              Upload multiple artworks to start tracking your progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Skill Progression</CardTitle>
            </CardHeader>
            <CardContent>
              {processedData && processedData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        domain={[0, 3]}
                        ticks={[1, 2, 3]}
                        tickFormatter={(value) => 
                          value === 1 ? 'Beginner' :
                          value === 2 ? 'Intermediate' : 'Advanced'
                        }
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border p-2 rounded-lg shadow-lg">
                                <p className="font-medium">{data.title}</p>
                                <p className="text-sm text-muted-foreground">{data.date}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="technicalScore"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Not enough data to generate progress chart
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Progress */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <CardTitle>Recent Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                {recentImprovements?.length ? (
                  <ul className="list-disc list-inside space-y-2">
                    {recentImprovements.map((improvement, i) => (
                      <li key={i} className="text-muted-foreground">
                        {improvement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Upload more artwork to track improvements
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <CardTitle>Consistent Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                {consistentStrengths?.length ? (
                  <ul className="list-disc list-inside space-y-2">
                    {consistentStrengths.map((strength, i) => (
                      <li key={i} className="text-muted-foreground">
                        {strength}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    Upload more artwork to identify patterns
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}