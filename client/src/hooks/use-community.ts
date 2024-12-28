import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CommentData {
  content: string;
  artworkId: number;
}

interface RatingData {
  score: number;
  artworkId: number;
}

export function useCommunity() {
  const queryClient = useQueryClient();

  const commentMutation = useMutation({
    mutationFn: async (data: CommentData) => {
      const response = await fetch(`/api/artwork/${data.artworkId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (data: RatingData) => {
      const response = await fetch(`/api/artwork/${data.artworkId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: data.score }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
  });

  return {
    comment: commentMutation.mutateAsync,
    rate: rateMutation.mutateAsync,
    isCommenting: commentMutation.isPending,
    isRating: rateMutation.isPending,
  };
}
