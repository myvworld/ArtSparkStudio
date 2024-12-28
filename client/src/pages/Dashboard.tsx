import { useState } from "react";
import { useArtwork } from "@/hooks/use-artwork";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Upload, Image as ImageIcon, Palette, Layout, Brush } from "lucide-react";

export default function Dashboard() {
  const { artworks, upload, isLoading, isUploading } = useArtwork();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const goals = formData.get("goals") as string;
    const image = formData.get("image") as File;

    if (!title || !image) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await upload({ title, goals, image });
      toast({
        title: "Success",
        description: "Artwork uploaded and analyzed successfully",
      });
      setDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload artwork",
        variant: "destructive",
      });
    }
  };

  const renderStyleAnalysis = (analysis: any) => {
    if (!analysis?.style) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h4 className="font-medium">Style Analysis</h4>
        </div>
        <div className="grid gap-2 text-sm">
          <p><span className="font-medium">Style:</span> {analysis.style.current}</p>
          {analysis.style.influences?.length > 0 && (
            <p><span className="font-medium">Influences:</span> {analysis.style.influences.join(", ")}</p>
          )}
          {analysis.style.period && (
            <p><span className="font-medium">Period:</span> {analysis.style.period}</p>
          )}
          {analysis.style.movement && (
            <p><span className="font-medium">Movement:</span> {analysis.style.movement}</p>
          )}
        </div>
      </div>
    );
  };

  const renderCompositionAnalysis = (analysis: any) => {
    if (!analysis?.composition) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary" />
          <h4 className="font-medium">Composition</h4>
        </div>
        <div className="grid gap-2 text-sm">
          <p><span className="font-medium">Structure:</span> {analysis.composition.structure}</p>
          <p><span className="font-medium">Balance:</span> {analysis.composition.balance}</p>
          <p><span className="font-medium">Color Theory:</span> {analysis.composition.colorTheory}</p>
          {analysis.composition.focusPoints?.length > 0 && (
            <p><span className="font-medium">Focus Points:</span> {analysis.composition.focusPoints.join(", ")}</p>
          )}
        </div>
      </div>
    );
  };

  const renderTechnicalAnalysis = (analysis: any) => {
    if (!analysis?.technique) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brush className="w-4 h-4 text-primary" />
          <h4 className="font-medium">Technical Analysis</h4>
        </div>
        <div className="grid gap-2 text-sm">
          <p><span className="font-medium">Medium:</span> {analysis.technique.medium}</p>
          <p><span className="font-medium">Execution:</span> {analysis.technique.execution}</p>
          <p><span className="font-medium">Skill Level:</span> {analysis.technique.skillLevel}</p>
          {analysis.technique.uniqueApproaches?.length > 0 && (
            <p><span className="font-medium">Unique Approaches:</span> {analysis.technique.uniqueApproaches.join(", ")}</p>
          )}
        </div>
      </div>
    );
  };

  const renderFeedback = (feedback: any) => {
    if (!feedback || !feedback.analysis) return null;

    const analysis = feedback.analysis;
    return (
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="composition">Composition</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Overall Analysis</h3>
              <p className="text-sm text-muted-foreground">
                {analysis.detailedFeedback}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {analysis.strengths?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Strengths</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {analysis.strengths.map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.improvements?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Areas for Improvement</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {analysis.improvements.map((improvement: string, i: number) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="style">
            {renderStyleAnalysis(analysis)}
          </TabsContent>

          <TabsContent value="composition">
            {renderCompositionAnalysis(analysis)}
          </TabsContent>

          <TabsContent value="technical">
            {renderTechnicalAnalysis(analysis)}
          </TabsContent>
        </Tabs>

        {analysis.learningResources?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Learning Resources</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {analysis.learningResources.map((resource: string, i: number) => (
                <li key={i}>{resource}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Artwork</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="w-4 h-4" /> Upload New Art
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Artwork</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Input
                  name="title"
                  placeholder="Artwork Title"
                  required
                />
              </div>
              <div>
                <Textarea
                  name="goals"
                  placeholder="What are your goals for this piece? (optional)"
                  rows={3}
                />
              </div>
              <div>
                <Input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Upload & Analyze"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !artworks?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Artwork Yet</h2>
            <p className="text-muted-foreground mb-4">
              Upload your first piece to get AI-powered feedback
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Upload Artwork</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Artwork</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Input
                      name="title"
                      placeholder="Artwork Title"
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      name="goals"
                      placeholder="What are your goals for this piece? (optional)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Input
                      type="file"
                      name="image"
                      accept="image/*"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isUploading} className="w-full">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Upload & Analyze"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <Card key={artwork.id}>
              <CardHeader>
                <CardTitle>{artwork.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="rounded-lg mb-4 aspect-square object-cover"
                />
                {artwork.feedback?.[0] && renderFeedback(artwork.feedback[0])}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}