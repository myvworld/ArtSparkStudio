import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { setupAuth } from "./auth";
import { analyzeArtwork } from "./openai";
import { db } from "@db";
import { artworks, feedback } from "@db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
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

  // Artwork routes
  app.post("/api/artwork", upload.single("image"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const { title, goals } = req.body;
      const imageBase64 = req.file.buffer.toString("base64");

      console.log(`Processing artwork upload for user ${req.user!.id}`);

      // Store artwork with safe defaults for new columns
      const [artwork] = await db
        .insert(artworks)
        .values({
          userId: req.user!.id,
          title,
          imageUrl: `data:${req.file.mimetype};base64,${imageBase64}`,
          goals,
          isPublic: false, // Set default value
        })
        .returning();

      // Analyze with GPT-4 Vision
      console.log('Initiating artwork analysis');
      const analysis = await analyzeArtwork(imageBase64, goals);

      // Store feedback
      const [artworkFeedback] = await db
        .insert(feedback)
        .values({
          artworkId: artwork.id,
          analysis: analysis,
          suggestions: {
            improvements: analysis.improvements,
            strengths: analysis.strengths,
          },
        })
        .returning();

      console.log(`Successfully processed artwork ${artwork.id}`);
      res.json({ artwork, feedback: artworkFeedback });
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

      console.log(`Fetching artworks for user ${req.user!.id}`);

      // Use a safer query that doesn't depend on new columns
      const userArtworks = await db
        .select()
        .from(artworks)
        .where(eq(artworks.userId, req.user!.id))
        .orderBy(artworks.createdAt);

      // Fetch feedback separately to avoid join issues
      const artworksWithFeedback = await Promise.all(
        userArtworks.map(async (artwork) => {
          const feedbackItems = await db
            .select()
            .from(feedback)
            .where(eq(feedback.artworkId, artwork.id));
          return { ...artwork, feedback: feedbackItems };
        })
      );

      console.log(`Successfully fetched ${artworksWithFeedback.length} artworks`);
      res.json(artworksWithFeedback);
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
        customer: req.user!.stripeCustomerId,
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