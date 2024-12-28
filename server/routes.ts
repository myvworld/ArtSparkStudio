import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { setupAuth } from "./auth";
import { db } from "@db";
import { 
  artworks, 
  users, 
  comments,
  ratings
} from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Add user's rating to gallery response
  app.get("/api/gallery", async (req, res) => {
    try {
      console.log('Fetching gallery data for user:', req.user?.id);
      const publicArtworks = await db
        .select({
          id: artworks.id,
          title: artworks.title,
          imageUrl: artworks.imageUrl,
          createdAt: artworks.createdAt,
          username: users.username,
          userId: users.id,
          averageRating: sql<number>`ROUND(CAST(COALESCE(AVG(${ratings.score}), 0) AS DECIMAL(10,1)), 1)`,
          commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`,
          userRating: req.user
            ? sql<number>`MAX(CASE WHEN ${ratings.userId} = ${req.user.id} THEN ${ratings.score} END)`
            : sql<null>`NULL`,
        })
        .from(artworks)
        .innerJoin(users, eq(users.id, artworks.userId))
        .leftJoin(ratings, eq(ratings.artworkId, artworks.id))
        .leftJoin(comments, eq(comments.artworkId, artworks.id))
        .where(eq(artworks.isPublic, true))
        .groupBy(artworks.id, users.id, users.username)
        .orderBy(desc(artworks.createdAt));

      console.log('Gallery data:', JSON.stringify(publicArtworks[0], null, 2));
      res.json(publicArtworks);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).send("Error fetching gallery");
    }
  });

  // Get comments for an artwork
  app.get("/api/artwork/:id/comments", async (req, res) => {
    try {
      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).send("Invalid artwork ID");
      }

      const artworkComments = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          username: users.username,
          userId: users.id,
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(eq(comments.artworkId, artworkId))
        .orderBy(desc(comments.createdAt));

      res.json(artworkComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).send("Error fetching comments");
    }
  });

  // Add a comment to an artwork
  app.post("/api/artwork/:id/comments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).send("Invalid artwork ID");
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).send("Comment content is required");
      }

      const [artwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.id, artworkId));

      if (!artwork) {
        return res.status(404).send("Artwork not found");
      }

      const [comment] = await db
        .insert(comments)
        .values({
          artworkId,
          userId: req.user.id,
          content,
        })
        .returning();

      res.json(comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).send("Error adding comment");
    }
  });

  // Rate an artwork
  app.post("/api/artwork/:id/rate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).send("Invalid artwork ID");
      }

      const { score } = req.body;
      if (typeof score !== 'number' || score < 1 || score > 5) {
        return res.status(400).send("Score must be between 1 and 5");
      }

      const [existingRating] = await db
        .select()
        .from(ratings)
        .where(
          and(
            eq(ratings.artworkId, artworkId),
            eq(ratings.userId, req.user.id)
          )
        );

      if (existingRating) {
        const [updated] = await db
          .update(ratings)
          .set({ score })
          .where(eq(ratings.id, existingRating.id))
          .returning();
        return res.json(updated);
      }

      const [rating] = await db
        .insert(ratings)
        .values({
          artworkId,
          userId: req.user.id,
          score,
        })
        .returning();

      res.json(rating);
    } catch (error) {
      console.error('Error rating artwork:', error);
      res.status(500).send("Error rating artwork");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}