import { 
  pgTable, 
  text, 
  serial, 
  timestamp, 
  boolean,
  integer,
  json,
  varchar
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("image_url").notNull(),
  goals: text("goals"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  analysis: json("analysis").$type<{
    style?: string;
    composition?: string;
    technique?: string;
    strengths?: string[];
    improvements?: string[];
    detailedFeedback?: string;
  }>().notNull(),
  suggestions: json("suggestions").$type<{
    strengths?: string[];
    improvements?: string[];
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const styleComparisons = pgTable("style_comparisons", {
  id: serial("id").primaryKey(),
  currentArtworkId: integer("current_artwork_id").references(() => artworks.id).notNull(),
  previousArtworkId: integer("previous_artwork_id").references(() => artworks.id).notNull(),
  comparison: json("comparison").$type<{
    similarities: string[];
    differences: string[];
    evolution: {
      improvements: string[];
      consistentStrengths: string[];
      newTechniques: string[];
    };
    recommendations: string[];
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const artworkRelations = relations(artworks, ({ one, many }) => ({
  user: one(users, {
    fields: [artworks.userId],
    references: [users.id],
  }),
  feedback: many(feedback),
  currentComparisons: many(styleComparisons, { relationName: "currentArtwork" }),
  previousComparisons: many(styleComparisons, { relationName: "previousArtwork" }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  artwork: one(artworks, {
    fields: [feedback.artworkId],
    references: [artworks.id],
  }),
}));

export const styleComparisonRelations = relations(styleComparisons, ({ one }) => ({
  currentArtwork: one(artworks, {
    fields: [styleComparisons.currentArtworkId],
    references: [artworks.id],
    relationName: "currentArtwork",
  }),
  previousArtwork: one(artworks, {
    fields: [styleComparisons.previousArtworkId],
    references: [artworks.id],
    relationName: "previousArtwork",
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const insertArtworkSchema = createInsertSchema(artworks);
export const selectArtworkSchema = createSelectSchema(artworks);
export type Artwork = typeof artworks.$inferSelect;
export type NewArtwork = typeof artworks.$inferInsert;

export const insertFeedbackSchema = createInsertSchema(feedback);
export const selectFeedbackSchema = createSelectSchema(feedback);
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

export const insertStyleComparisonSchema = createInsertSchema(styleComparisons);
export const selectStyleComparisonSchema = createSelectSchema(styleComparisons);
export type StyleComparison = typeof styleComparisons.$inferSelect;
export type NewStyleComparison = typeof styleComparisons.$inferInsert;