import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { setupAuth } from "./auth";
import { analyzeArtwork, compareArtworkStyles } from "./openai";
import { db } from "@db";
import { 
  artworks, 
  feedback, 
  styleComparisons, 
  users, 
  comments,
  ratings,
  type User
} from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import Stripe from "stripe";

// Declare express user type
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      subscriptionTier: string;
      stripeCustomerId?: string;
    }
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Community gallery route
  app.get("/api/gallery", async (req, res) => {
    try {
      const publicArtworks = await db
        .select({
          id: artworks.id,
          title: artworks.title,
          imageUrl: artworks.imageUrl,
          createdAt: artworks.createdAt,
          username: users.username,
          userId: users.id,
          averageRating: sql<number>`CAST(COALESCE(AVG(${ratings.score}), 0) AS DECIMAL(10,1))`,
          commentCount: sql<number>`COUNT(DISTINCT ${comments.id})`,
        })
        .from(artworks)
        .innerJoin(users, eq(users.id, artworks.userId))
        .leftJoin(ratings, eq(ratings.artworkId, artworks.id))
        .leftJoin(comments, eq(comments.artworkId, artworks.id))
        .where(eq(artworks.isPublic, true))
        .groupBy(artworks.id, users.id)
        .orderBy(desc(artworks.createdAt));

      res.json(publicArtworks);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      res.status(500).send("Error fetching gallery");
    }
  });

  // Artwork visibility toggle
  app.patch("/api/artwork/:id/visibility", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).send("Invalid artwork ID");
      }

      const [artwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.id, artworkId));

      if (!artwork) {
        return res.status(404).send("Artwork not found");
      }

      if (artwork.userId !== req.user?.id) {
        return res.status(403).send("Not authorized to update this artwork");
      }

      const [updated] = await db
        .update(artworks)
        .set({ isPublic: !artwork.isPublic })
        .where(eq(artworks.id, artworkId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Error updating visibility:', error);
      res.status(500).send("Error updating visibility");
    }
  });

  // Comments routes
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

  // Rating routes
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

  // Get average rating for an artwork
  app.get("/api/artwork/:id/rating", async (req, res) => {
    try {
      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).send("Invalid artwork ID");
      }

      const result = await db
        .select({
          averageRating: sql<number>`COALESCE(AVG(${ratings.score}), 0)`,
          totalRatings: sql<number>`COUNT(*)`,
          userRating: req.user
            ? sql<number>`MAX(CASE WHEN ${ratings.userId} = ${req.user.id} THEN ${ratings.score} END)`
            : sql<null>`NULL`,
        })
        .from(ratings)
        .where(eq(ratings.artworkId, artworkId));

      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching rating:', error);
      res.status(500).send("Error fetching rating");
    }
  });

  // Delete artwork route
  app.delete("/api/artwork/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).send("Invalid artwork ID");
      }

      // Verify ownership
      const [artwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.id, artworkId))
        .limit(1);

      if (!artwork) {
        return res.status(404).send("Artwork not found");
      }

      if (artwork.userId !== req.user?.id) {
        return res.status(403).send("Not authorized to delete this artwork");
      }

      // Delete associated records (style comparisons and feedback)
      await db.transaction(async (tx) => {
        await tx.delete(styleComparisons).where(eq(styleComparisons.currentArtworkId, artworkId));
        await tx.delete(styleComparisons).where(eq(styleComparisons.previousArtworkId, artworkId));
        await tx.delete(feedback).where(eq(feedback.artworkId, artworkId));
        await tx.delete(comments).where(eq(comments.artworkId, artworkId));
        await tx.delete(ratings).where(eq(ratings.artworkId, artworkId));
        await tx.delete(artworks).where(eq(artworks.id, artworkId));
      });

      res.json({ message: "Artwork deleted successfully" });
    } catch (error) {
      console.error('Error deleting artwork:', error);
      res.status(500).send("Error deleting artwork");
    }
  });

  // Artwork routes
  app.post("/api/artwork", upload.single("image"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const { title, goals, isPublic = false } = req.body;
      const imageBase64 = req.file.buffer.toString("base64");
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).send("User ID not found");
      }

      console.log(`Processing artwork upload for user ${userId}`);

      // Store artwork
      const [artwork] = await db
        .insert(artworks)
        .values({
          userId,
          title,
          imageUrl: `data:${req.file.mimetype};base64,${imageBase64}`,
          goals,
          isPublic: Boolean(isPublic)
        })
        .returning();

      // Get previous artwork for comparison
      const [previousArtwork] = await db
        .select()
        .from(artworks)
        .where(eq(artworks.userId, userId))
        .orderBy(desc(artworks.createdAt))
        .limit(1)
        .offset(1);

      // Analyze with GPT-4 Vision
      console.log('Initiating artwork analysis');
      const analysis = await analyzeArtwork(imageBase64, title, goals);

      // Store feedback with the correct type
      const [artworkFeedback] = await db
        .insert(feedback)
        .values({
          artworkId: artwork.id,
          analysis: {
            style: analysis.style.current,
            composition: analysis.composition.structure,
            technique: analysis.technique.medium,
            strengths: analysis.strengths,
            improvements: analysis.improvements,
            detailedFeedback: analysis.detailedFeedback,
          },
          suggestions: {
            strengths: analysis.strengths,
            improvements: analysis.improvements,
          },
        })
        .returning();

      // If there's a previous artwork, perform style comparison
      let styleComparison = null;
      if (previousArtwork) {
        console.log('Comparing with previous artwork');
        const previousImageBase64 = previousArtwork.imageUrl.split(',')[1];
        const comparison = await compareArtworkStyles(
          imageBase64,
          previousImageBase64,
          artwork.title,
          previousArtwork.title
        );

        [styleComparison] = await db
          .insert(styleComparisons)
          .values({
            currentArtworkId: artwork.id,
            previousArtworkId: previousArtwork.id,
            comparison,
          })
          .returning();
      }

      console.log(`Successfully processed artwork ${artwork.id}`);
      res.json({ 
        artwork, 
        feedback: artworkFeedback,
        styleComparison 
      });
    } catch (error) {
      console.error('Error processing artwork:', error);
      res.status(500).send("Error processing artwork");
    }
  });

  app.get("/api/artwork", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("User ID not found");
      }

      console.log(`Fetching artworks for user ${userId}`);

      // Get artworks with feedback and style comparisons
      const userArtworks = await db
        .select()
        .from(artworks)
        .where(eq(artworks.userId, userId))
        .orderBy(desc(artworks.createdAt));

      // Fetch feedback and comparisons for each artwork
      const artworksWithDetails = await Promise.all(
        userArtworks.map(async (artwork) => {
          const [feedbackItems, comparisonsAsCurrent, comparisonsAsPrevious] = await Promise.all([
            db
              .select()
              .from(feedback)
              .where(eq(feedback.artworkId, artwork.id)),
            db
              .select()
              .from(styleComparisons)
              .where(eq(styleComparisons.currentArtworkId, artwork.id)),
            db
              .select()
              .from(styleComparisons)
              .where(eq(styleComparisons.previousArtworkId, artwork.id))
          ]);

          return {
            ...artwork,
            feedback: feedbackItems,
            styleComparisons: {
              asCurrent: comparisonsAsCurrent,
              asPrevious: comparisonsAsPrevious
            }
          };
        })
      );

      console.log(`Successfully fetched ${artworksWithDetails.length} artworks`);
      res.json(artworksWithDetails);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      res.status(500).send("Error fetching artworks");
    }
  });

  // Subscription routes
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const { priceId } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.REPLIT_DOMAINS?.split(",")[0]}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.REPLIT_DOMAINS?.split(",")[0]}/subscription`,
        customer: req.user?.stripeCustomerId || undefined,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating checkout session");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}