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
      const response = await fetch("/api/artwork", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadArtworkData) => {
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
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (artworkId: number) => {
      const response = await fetch(`/api/artwork/${artworkId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (artworkId: number) => {
      const response = await fetch(`/api/artwork/${artworkId}/visibility`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
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
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTogglingVisibility: toggleVisibilityMutation.isPending,
  };
}