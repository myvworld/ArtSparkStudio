import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCommunity } from "@/hooks/use-community";
import { Loader2, Star, MessageSquare, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface GalleryArtwork {
  id: number;
  title: string;
  imageUrl: string;
  createdAt: string;
  username: string;
  userId: number;
  averageRating: string | null;
  commentCount: string | null;
  userRating: number | null;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  username: string;
  userId: number;
}

export default function Gallery() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedArtwork, setSelectedArtwork] = useState<GalleryArtwork | null>(null);
  const [comment, setComment] = useState("");
  const { comment: submitComment, rate: submitRating, isCommenting, isRating } = useCommunity();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const { data: artworks = [], isLoading, refetch } = useQuery<GalleryArtwork[]>({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      const response = await fetch("/api/gallery", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onError: (error: Error) => {
      console.error('Error fetching gallery:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery",
        variant: "destructive",
      });
    },
  });

  const handleComment = async (artworkId: number) => {
    if (!comment.trim()) return;

    try {
      await submitComment({ artworkId, content: comment });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      setComment("");
      refetch();
      setSelectedArtwork(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRating = async (artworkId: number, score: number) => {
    try {
      await submitRating({ artworkId, score });
      toast({
        title: "Success",
        description: "Rating submitted successfully",
      });
      refetch();

      if (selectedArtwork) {
        setSelectedArtwork({
          ...selectedArtwork,
          userRating: score,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatRating = (rating: string | number | null | undefined): string => {
    if (rating === null || rating === undefined) return '0.0';
    return Number(rating).toFixed(1);
  };

  useEffect(() => {
    async function loadComments() {
      if (!selectedArtwork) return;

      setIsLoadingComments(true);
      try {
        const response = await fetch(`/api/artwork/${selectedArtwork.id}/comments`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        setComments(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      } finally {
        setIsLoadingComments(false);
      }
    }

    loadComments();
  }, [selectedArtwork, toast]);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setSelectedArtwork(null);
      setComments([]);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Community Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Share your creations with the vibrant ArtSpark community and showcase your talent to a wider audience. Submitted images have the chance to be featured on the landing page, giving your artwork the spotlight it deserves.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !artworks?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">No Artworks Yet</h2>
            <p className="text-muted-foreground">
              Be the first to share your artwork with the community
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{artwork.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">by {artwork.username}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {formatRating(artwork.averageRating)}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {parseInt(artwork.commentCount || "0")}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <button
                  className="w-full"
                  onClick={() => setSelectedArtwork(artwork)}
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-full aspect-square object-cover transition-transform hover:scale-105"
                  />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedArtwork} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
            <div className="flex justify-between items-center">
              <DialogTitle>{selectedArtwork?.title}</DialogTitle>
              <DialogClose className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <img
              src={selectedArtwork?.imageUrl}
              alt={selectedArtwork?.title}
              className="w-full rounded-lg"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                by {selectedArtwork?.username}
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    disabled={isRating}
                    onClick={() => selectedArtwork && handleRating(selectedArtwork.id, score)}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedArtwork && (
                          score <= (parseInt(selectedArtwork.userRating?.toString() || "0"))
                            ? 'fill-primary text-primary'
                            : score <= (parseFloat(selectedArtwork.averageRating || "0"))
                              ? 'fill-muted text-muted'
                              : ''
                        )
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="bg-purple-950/30 rounded-lg p-4 mb-6 border border-purple-800/30">
                    <h4 className="font-semibold mb-2">Foster a Positive Community</h4>
                    <p className="text-sm text-muted-foreground">
                      At ArtSpark, we believe in uplifting and supporting one another. When commenting on artwork in the Community Gallery, remember to be kind, constructive, and encouraging. Your thoughtful feedback can inspire fellow artists and help nurture a welcoming environment for creativity to thrive.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Let's celebrate each other's journeys and grow together as a community of creators!
                    </p>
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{comment.username}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                            {user?.isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(
                                      `/api/artwork/${selectedArtwork?.id}/comments/${comment.id}`,
                                      {
                                        method: 'DELETE',
                                        credentials: 'include',
                                      }
                                    );
                                    if (!response.ok) throw new Error('Failed to delete comment');
                                    setComments(comments.filter(c => c.id !== comment.id));
                                    toast({
                                      title: "Success",
                                      description: "Comment deleted successfully",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete comment",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    disabled={isCommenting || !comment.trim()}
                    onClick={() => selectedArtwork && handleComment(selectedArtwork.id)}
                  >
                    {isCommenting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Comment...
                      </>
                    ) : (
                      "Add Comment"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}