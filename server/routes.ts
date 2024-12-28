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

      // Store artwork
      const [artwork] = await db
        .insert(artworks)
        .values({
          userId: req.user!.id,
          title,
          imageUrl: `data:${req.file.mimetype};base64,${imageBase64}`,
          goals,
        })
        .returning();

      // Analyze with GPT-4 Vision
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

      res.json({ artwork, feedback: artworkFeedback });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error processing artwork");
    }
  });

  app.get("/api/artwork", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userArtworks = await db.query.artworks.findMany({
      where: eq(artworks.userId, req.user!.id),
      with: {
        feedback: true,
      },
      orderBy: (artworks, { desc }) => [desc(artworks.createdAt)],
    });

    res.json(userArtworks);
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
