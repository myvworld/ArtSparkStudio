import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Artwork } from "@db/schema";

interface UploadArtworkData {
  title: string;
  goals?: string;
  image: File;
}

export function useArtwork() {
  const queryClient = useQueryClient();

  const { data: artworks, isLoading } = useQuery<Artwork[]>({
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

  return {
    artworks,
    isLoading,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
  };
}
