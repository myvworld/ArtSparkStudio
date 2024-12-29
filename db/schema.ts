import { 
  pgTable, 
  text, 
  serial, 
  timestamp, 
  boolean,
  integer,
  json,
  varchar,
  decimal,
  foreignKey
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  tokenBalance: decimal("token_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  monthlyUploadsUsed: integer("monthly_uploads_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokenPackages = pgTable("token_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  credits: integer("credits").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokenPurchases = pgTable("token_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  packageId: integer("package_id").references(() => tokenPackages.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  credits: integer("credits").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioReviews = pgTable("portfolio_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reportContent: json("report_content").notNull(),
  status: text("status").default("pending").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: text("stripe_payment_id"),
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
  tokensCost: decimal("tokens_cost", { precision: 10, scale: 2 }),
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
  suggestions: text("suggestions").array().notNull().default(['Upload your next artwork to see how your style evolves! The AI will analyze your progress and provide insights on your artistic development.']),
  analysis: json("analysis").$type<{
    style?: {
      current: string;
      influences?: string[];
      similarArtists?: string[];
      period?: string;
      movement?: string;
    };
    composition?: {
      structure: string;
      balance: string;
      colorTheory: string;
      perspective?: string;
      focusPoints?: string[];
      dynamicElements?: string[];
    };
    technique?: {
      medium: string;
      execution: string;
      skillLevel: string;
      uniqueApproaches?: string[];
      materialUsage?: string;
    };
    strengths?: string[];
    improvements?: string[];
    detailedFeedback: string;
    technicalSuggestions?: string[];
    learningResources?: string[];
  }>(),
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

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(), 
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  monthlyUploadLimit: integer("monthly_upload_limit").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  features: json("features").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const userRelations = relations(users, ({ many, one }) => ({
  artworks: many(artworks),
  tokenPurchases: many(tokenPurchases),
  portfolioReviews: many(portfolioReviews),
  subscriptionPlan: one(subscriptionPlans, {
    fields: [users.subscriptionTier],
    references: [subscriptionPlans.code],
  }),
}));

export const tokenPackageRelations = relations(tokenPackages, ({ many }) => ({
  purchases: many(tokenPurchases),
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

export const subscriptionPlanRelations = relations(subscriptionPlans, ({ many }) => ({
  users: many(users),
}));

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
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

export const insertTokenPackageSchema = createInsertSchema(tokenPackages);
export const selectTokenPackageSchema = createSelectSchema(tokenPackages);
export type TokenPackage = typeof tokenPackages.$inferSelect;
export type NewTokenPackage = typeof tokenPackages.$inferInsert;

export const insertTokenPurchaseSchema = createInsertSchema(tokenPurchases);
export const selectTokenPurchaseSchema = createSelectSchema(tokenPurchases);
export type TokenPurchase = typeof tokenPurchases.$inferSelect;
export type NewTokenPurchase = typeof tokenPurchases.$inferInsert;

export const insertPortfolioReviewSchema = createInsertSchema(portfolioReviews);
export const selectPortfolioReviewSchema = createSelectSchema(portfolioReviews);
export type PortfolioReview = typeof portfolioReviews.$inferSelect;
export type NewPortfolioReview = typeof portfolioReviews.$inferInsert;

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlanSchema = createSelectSchema(subscriptionPlans);
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;