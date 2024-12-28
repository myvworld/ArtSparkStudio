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
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  analysis: json("analysis").$type<{
    style: {
      current: string;
      influences?: string[];
      similarArtists?: string[];
      period?: string;
      movement?: string;
    };
    composition: {
      structure: string;
      balance: string;
      colorTheory: string;
      perspective?: string;
      focusPoints?: string[];
      dynamicElements?: string[];
    };
    technique: {
      medium: string;
      execution: string;
      skillLevel: string;
      uniqueApproaches?: string[];
      materialUsage?: string;
    };
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
    technicalSuggestions?: string[];
    learningResources?: string[];
  }>().notNull(),
  suggestions: json("suggestions").$type<{
    strengths: string[];
    improvements: string[];
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

// Relations
export const artworkRelations = relations(artworks, ({ one, many }) => ({
  user: one(users, {
    fields: [artworks.userId],
    references: [users.id],
  }),
  feedback: many(feedback),
  comments: many(comments),
  ratings: many(ratings),
  currentComparisons: many(styleComparisons, { relationName: "currentArtwork" }),
  previousComparisons: many(styleComparisons, { relationName: "previousArtwork" }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  artwork: one(artworks, {
    fields: [comments.artworkId],
    references: [artworks.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  artwork: one(artworks, {
    fields: [ratings.artworkId],
    references: [artworks.id],
  }),
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

// Schema types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = {
  id: number;
  username: string;
  email: string;
  subscriptionTier: string;
  stripeCustomerId?: string | null;
  createdAt: Date;
  password: string;
};
export type NewUser = typeof users.$inferInsert;

export const insertArtworkSchema = createInsertSchema(artworks);
export const selectArtworkSchema = createSelectSchema(artworks);
export type Artwork = typeof artworks.$inferSelect;
export type NewArtwork = typeof artworks.$inferInsert;

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export const insertRatingSchema = createInsertSchema(ratings);
export const selectRatingSchema = createSelectSchema(ratings);
export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;

export const insertFeedbackSchema = createInsertSchema(feedback);
export const selectFeedbackSchema = createSelectSchema(feedback);
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

export const insertStyleComparisonSchema = createInsertSchema(styleComparisons);
export const selectStyleComparisonSchema = createSelectSchema(styleComparisons);
export type StyleComparison = typeof styleComparisons.$inferSelect;
export type NewStyleComparison = typeof styleComparisons.$inferInsert;