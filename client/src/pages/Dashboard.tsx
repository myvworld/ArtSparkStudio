import { useState } from "react";
import { useArtwork, useUpdateArtworkTitle } from "@/hooks/use-artwork"; // Added useUpdateArtworkTitle
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
import {
  Loader2,
  Upload,
  Image as ImageIcon,
  Palette,
  Layout,
  Brush,
  Trash2,
  Globe,
  Lock,
  Pencil
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const renderStyleComparison = (comparison: any) => {
  if (!comparison) return null;

  return (
    <div className="space-y-4 border-t pt-4">
      <h4 className="font-medium">Progress Analysis</h4>
      <div className="grid gap-4 md:grid-cols-2">
        {comparison.similarities?.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2">Consistent Elements</h5>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {comparison.similarities.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {comparison.differences?.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2">Style Evolution</h5>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {comparison.differences.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {comparison.evolution && (
        <div className="space-y-3">
          {comparison.evolution.improvements?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Areas of Improvement</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {comparison.evolution.improvements.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {comparison.evolution.newTechniques?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">New Techniques</h5>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {comparison.evolution.newTechniques.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {comparison.recommendations?.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Recommendations</h5>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {comparison.recommendations.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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

const renderFeedback = (feedback: any, styleComparison: any) => {
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

      {styleComparison && (
        <div className="mt-6">
          <h4 className="font-semibold mb-4">Style Evolution</h4>
          <p className="text-sm text-muted-foreground mb-4">
            This analysis compares your current work with your previous artwork to track your artistic growth and development.
          </p>
          {renderStyleComparison(styleComparison.comparison)}
        </div>
      )}

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

export default function Dashboard() {
  const { artworks, upload, delete: deleteArtwork, toggleVisibility, updateTitle, isLoading, isUploading, isDeleting, isTogglingVisibility, isUpdatingTitle } = useArtwork();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleDelete = async (artworkId: number) => {
    try {
      await deleteArtwork(artworkId);
      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete artwork",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (artworkId: number, currentVisibility: boolean) => {
    try {
      setTogglingId(artworkId);
      await toggleVisibility({ artworkId, isPublic: !currentVisibility });
      toast({
        title: "Success",
        description: `Artwork ${currentVisibility ? 'removed from' : 'shared to'} community gallery`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update visibility",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

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


  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Artwork</h1>
          <p className="text-muted-foreground mt-2">
            Upload your artwork to get AI-powered feedback. Upload multiple pieces to track your progress and artistic development over time.
          </p>
        </div>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>{artwork.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isTogglingVisibility && togglingId === artwork.id}
                    onClick={() => handleToggleVisibility(artwork.id, artwork.isPublic)}
                    title={artwork.isPublic ? "Remove from community gallery" : "Share to community gallery"}
                  >
                    {isTogglingVisibility && togglingId === artwork.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : artwork.isPublic ? (
                      <Globe className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isDeleting && deletingId === artwork.id}
                      >
                        {isDeleting && deletingId === artwork.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Artwork</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this artwork? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setDeletingId(artwork.id);
                            handleDelete(artwork.id);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* Added Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    // Add onClick handler for editing title here if needed.  This would require additional backend logic.
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>

                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="rounded-lg mb-4 aspect-square object-cover"
                />
                {artwork.feedback?.[0] && renderFeedback(
                  artwork.feedback[0],
                  artwork.styleComparisons?.asCurrent?.[0]
                )}
                {!artwork.styleComparisons?.asCurrent?.[0] && artworks.length > 1 && (
                  <div className="text-sm text-muted-foreground mt-4 p-4 bg-muted/30 rounded-lg">
                    <p>Upload your next artwork to see how your style evolves! The AI will analyze your progress and provide insights on your artistic development.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}