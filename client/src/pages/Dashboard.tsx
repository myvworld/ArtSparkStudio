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
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload artwork",
        variant: "destructive",
      });
    }
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
            <DialogTrigger asChild>
              <Button>Upload Artwork</Button>
            </DialogTrigger>
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
                {artwork.feedback?.[0] && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">AI Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      {artwork.feedback[0].analysis.detailedFeedback}
                    </p>
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
