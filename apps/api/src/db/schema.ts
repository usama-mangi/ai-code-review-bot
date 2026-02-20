import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Repositories ────────────────────────────────────────────────────────────

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  githubId: bigint("github_id", { mode: "number" }).notNull().unique(),
  fullName: text("full_name").notNull(), // e.g. "org/repo"
  installationId: bigint("installation_id", { mode: "number" }).notNull(),
  installedAt: timestamp("installed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    repoId: integer("repo_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    prNumber: integer("pr_number").notNull(),
    prTitle: text("pr_title"),
    prAuthor: text("pr_author"),
    prUrl: text("pr_url"),
    commitSha: text("commit_sha").notNull(),
    status: text("status").notNull().default("pending"), // pending | processing | completed | failed
    summary: text("summary"),
    filesChanged: integer("files_changed").default(0),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    // Prevent duplicate reviews for the same commit
    uniquePrCommit: uniqueIndex("unique_pr_commit").on(
      table.repoId,
      table.prNumber,
      table.commitSha
    ),
  })
);

// ─── Comments ─────────────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  lineNumber: integer("line_number"),
  diffPosition: integer("diff_position"), // GitHub diff position (for inline comments)
  severity: text("severity").notNull().default("info"), // bug | security | improvement | style | info
  body: text("body").notNull(),
  githubCommentId: bigint("github_comment_id", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [reviews.repoId],
    references: [repositories.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  review: one(reviews, {
    fields: [comments.reviewId],
    references: [reviews.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
