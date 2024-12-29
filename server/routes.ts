import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { setupAuth } from "./auth";
import { db } from "@db";
import { 
  artworks, 
  users, 
  comments,
  ratings,
  feedback,
  styleComparisons,
  subscriptionPlans
} from "@db/schema";
import { createStripeCheckoutSession, handleStripeWebhook, SUBSCRIPTION_PRICES } from "./stripe";
import { eq, desc, and, sql } from "drizzle-orm";
import express from 'express';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function requireAdmin(req: any, res: any, next: any) {
  console.log('Admin check:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    isAdmin: req.user?.isAdmin
  });

  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  if (!req.user.isAdmin) {
    return res.status(403).send("Not authorized");
  }

  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Add Stripe configuration endpoint with enhanced logging
  app.get("/api/subscription/config", (req, res) => {
    console.log('Fetching Stripe config:', {
      basicPriceId: SUBSCRIPTION_PRICES.basic,
      proPriceId: SUBSCRIPTION_PRICES.pro,
      mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    });

    // Only expose what the client needs
    res.json({
      basicPriceId: SUBSCRIPTION_PRICES.basic,
      proPriceId: SUBSCRIPTION_PRICES.pro,
      mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    });
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

  // Handle artwork upload
  app.post("/api/artwork", upload.single('image'), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const { title, goals } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      // Convert image to base64
      const imageBase64 = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

      const [artwork] = await db
        .insert(artworks)
        .values({
          userId: req.user.id,
          title,
          goals: goals || null,
          imageUrl,
          isPublic: false,
        })
        .returning();

      res.json(artwork);
    } catch (error) {
      console.error('Error uploading artwork:', error);
      res.status(500).json({ error: "Error uploading artwork" });
    }
  });

  // Update artwork visibility
  app.patch("/api/artwork/:id/visibility", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const artworkId = parseInt(req.params.id);
      const { isPublic } = req.body;

      if (isNaN(artworkId)) {
        return res.status(400).json({ error: "Invalid artwork ID" });
      }

      const [artwork] = await db
        .update(artworks)
        .set({ isPublic })
        .where(
          and(
            eq(artworks.id, artworkId),
            eq(artworks.userId, req.user.id)
          )
        )
        .returning();

      res.json(artwork);
    } catch (error) {
      console.error('Error updating artwork visibility:', error);
      res.status(500).json({ error: "Error updating artwork visibility" });
    }
  });

  // Delete artwork endpoint
  app.delete("/api/artwork/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const artworkId = parseInt(req.params.id);
      if (isNaN(artworkId)) {
        return res.status(400).json({ error: "Invalid artwork ID" });
      }

      await db
        .delete(artworks)
        .where(
          and(
            eq(artworks.id, artworkId),
            eq(artworks.userId, req.user.id)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting artwork:', error);
      res.status(500).json({ error: "Error deleting artwork" });
    }
  });

  // Add logging to the /api/artwork endpoint
  app.get("/api/artwork", async (req, res) => {
    try {
      console.log('Fetching artworks for user:', req.user?.id);
      const userArtworks = await db
        .select({
          id: artworks.id,
          title: artworks.title,
          imageUrl: artworks.imageUrl,
          goals: artworks.goals,
          isPublic: artworks.isPublic,
          createdAt: artworks.createdAt,
          feedback: sql<any>`
            json_agg(
              json_build_object(
                'id', ${feedback.id},
                'analysis', ${feedback.analysis}
              )
            )`,
          styleComparisons: sql<any>`
            json_build_object(
              'asCurrent', (
                SELECT json_agg(
                  json_build_object(
                    'id', sc1.id,
                    'comparison', sc1.comparison
                  )
                )
                FROM ${styleComparisons} sc1
                WHERE sc1.current_artwork_id = ${artworks.id}
              ),
              'asPrevious', (
                SELECT json_agg(
                  json_build_object(
                    'id', sc2.id,
                    'comparison', sc2.comparison
                  )
                )
                FROM ${styleComparisons} sc2
                WHERE sc2.previous_artwork_id = ${artworks.id}
              )
            )`
        })
        .from(artworks)
        .leftJoin(feedback, eq(feedback.artworkId, artworks.id))
        .where(eq(artworks.userId, req.user?.id || 0))
        .groupBy(artworks.id)
        .orderBy(desc(artworks.createdAt));

      console.log('Found artworks:', userArtworks.length);
      res.json(userArtworks);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      res.status(500).send("Error fetching artworks");
    }
  });

  // Subscription routes with enhanced logging
  app.post("/api/subscription/create-checkout-session", async (req, res) => {
    try {
      console.log('Received checkout session request:', {
        userId: req.user?.id,
        body: req.body
      });

      if (!req.isAuthenticated()) {
        console.log('User not authenticated');
        return res.status(401).send("Not authenticated");
      }

      const { priceId } = req.body;
      if (!priceId) {
        console.log('Missing priceId in request');
        return res.status(400).send("Price ID is required");
      }

      console.log('Creating checkout session with:', {
        userId: req.user.id,
        priceId: priceId
      });

      const session = await createStripeCheckoutSession(req.user.id, priceId);
      console.log('Checkout session created:', {
        sessionId: session.id,
        url: session.url
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        body: req.body
      });
      res.status(500).send("Error creating checkout session");
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      console.log('Received Stripe webhook');
      const signature = req.headers["stripe-signature"];
      if (!signature) {
        console.log('Missing Stripe signature');
        return res.status(400).send("Stripe signature is required");
      }

      const result = await handleStripeWebhook(signature, req.body);
      console.log('Webhook processed successfully');
      res.json(result);
    } catch (err) {
      const error = err as Error;
      console.error("Error handling webhook:", {
        error: error.message,
        type: req.headers["stripe-webhook-type"]
      });
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Admin routes
  app.get("/api/admin/subscription-plans", requireAdmin, async (req, res) => {
    try {
      console.log('Fetching subscription plans for admin');
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .orderBy(subscriptionPlans.monthlyPrice);

      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).send("Error fetching subscription plans");
    }
  });

  app.put("/api/admin/subscription-plans/:id", requireAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      if (isNaN(planId)) {
        return res.status(400).send("Invalid plan ID");
      }

      const {
        name,
        description,
        monthlyPrice,
        yearlyPrice,
        monthlyUploadLimit,
        features,
        isActive,
      } = req.body;

      const [updatedPlan] = await db
        .update(subscriptionPlans)
        .set({
          name,
          description,
          monthlyPrice,
          yearlyPrice,
          monthlyUploadLimit,
          features,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.id, planId))
        .returning();

      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).send("Error updating subscription plan");
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      console.log('Fetching users for admin');
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          subscriptionTier: users.subscriptionTier,
          monthlyUploadsUsed: users.monthlyUploadsUsed,
          tokenBalance: users.tokenBalance,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Error fetching users");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}