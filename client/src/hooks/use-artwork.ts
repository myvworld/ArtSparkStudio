
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Artwork, Feedback } from "@db/schema";

interface UploadArtworkData {
  title: string;
  goals?: string;
  image: File;
}

interface ArtworkWithFeedback extends Artwork {
  feedback?: Feedback[];
  styleComparisons?: {
    asCurrent?: any[];
    asPrevious?: any[];
  };
}

export function useArtwork() {
  const queryClient = useQueryClient();

  const { data: artworks, isLoading } = useQuery<ArtworkWithFeedback[]>({
    queryKey: ["artworks"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/artwork", {
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching artworks:", error);
        throw error;
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadArtworkData) => {
      try {
        const formData = new FormData();
        formData.append("title", data.title);
        if (data.goals) formData.append("goals", data.goals);
        formData.append("image", data.image);

        const response = await fetch("/api/artwork", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("Error uploading artwork:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (artworkId: number) => {
      try {
        const response = await fetch(`/api/artwork/${artworkId}`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("Error deleting artwork:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ artworkId, isPublic }: { artworkId: number; isPublic: boolean }) => {
      try {
        const response = await fetch(`/api/artwork/${artworkId}/visibility`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ isPublic: !isPublic })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("Error toggling visibility:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
  });

  const updateTitleMutation = useMutation({
    mutationFn: async ({ artworkId, title }: { artworkId: number; title: string }) => {
      try {
        const response = await fetch(`/api/artwork/${artworkId}/title`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ title })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("Error updating artwork title:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
  });

  return {
    artworks,
    isLoading,
    upload: uploadMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    toggleVisibility: toggleVisibilityMutation.mutateAsync,
    updateTitle: updateTitleMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingVisibility: toggleVisibilityMutation.isPending,
    isUpdatingTitle: updateTitleMutation.isPending,
  };
}
