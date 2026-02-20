import { Router, type Request, type Response, type IRouter } from "express";
import { db } from "../db/index.js";
import { reviews, comments, repositories } from "../db/schema.js";
import { eq, desc, count, sql } from "drizzle-orm";

export const reviewsRouter: IRouter = Router();

// GET /api/reviews — paginated list
reviewsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: reviews.id,
        prNumber: reviews.prNumber,
        prTitle: reviews.prTitle,
        prAuthor: reviews.prAuthor,
        prUrl: reviews.prUrl,
        commitSha: reviews.commitSha,
        status: reviews.status,
        summary: reviews.summary,
        filesChanged: reviews.filesChanged,
        createdAt: reviews.createdAt,
        completedAt: reviews.completedAt,
        repoFullName: repositories.fullName,
      })
      .from(reviews)
      .leftJoin(repositories, eq(reviews.repoId, repositories.id))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(reviews);

    res.json({
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/reviews/:id — single review with comments
reviewsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [review] = await db
      .select({
        id: reviews.id,
        prNumber: reviews.prNumber,
        prTitle: reviews.prTitle,
        prAuthor: reviews.prAuthor,
        prUrl: reviews.prUrl,
        commitSha: reviews.commitSha,
        status: reviews.status,
        summary: reviews.summary,
        filesChanged: reviews.filesChanged,
        errorMessage: reviews.errorMessage,
        createdAt: reviews.createdAt,
        completedAt: reviews.completedAt,
        repoFullName: repositories.fullName,
      })
      .from(reviews)
      .leftJoin(repositories, eq(reviews.repoId, repositories.id))
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) { res.status(404).json({ error: "Review not found" }); return; }

    const reviewComments = await db
      .select()
      .from(comments)
      .where(eq(comments.reviewId, id))
      .orderBy(comments.filePath, comments.lineNumber);

    res.json({ ...review, comments: reviewComments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// GET /api/stats — aggregate statistics
reviewsRouter.get("/stats/summary", async (_req: Request, res: Response) => {
  try {
    const [totals] = await db
      .select({
        totalReviews: count(reviews.id),
      })
      .from(reviews);

    const [commentTotals] = await db
      .select({ totalComments: count(comments.id) })
      .from(comments);

    const severityBreakdown = await db
      .select({
        severity: comments.severity,
        count: count(comments.id),
      })
      .from(comments)
      .groupBy(comments.severity);

    const reviewsOverTime = await db.execute(sql`
      SELECT 
        DATE_TRUNC('day', created_at)::date AS date,
        COUNT(*)::int AS count
      FROM reviews
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1
    `);

    const totalReviews = totals.totalReviews;
    const totalComments = commentTotals.totalComments;

    res.json({
      totalReviews,
      totalComments,
      avgCommentsPerReview:
        totalReviews > 0
          ? Math.round((totalComments / totalReviews) * 10) / 10
          : 0,
      severityBreakdown: Object.fromEntries(
        severityBreakdown.map((r) => [r.severity, r.count])
      ),
      reviewsOverTime: reviewsOverTime as unknown as Array<{ date: string; count: number }>,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/repos — list tracked repositories
reviewsRouter.get("/repos/list", async (_req: Request, res: Response) => {
  try {
    const repos = await db
      .select({
        id: repositories.id,
        fullName: repositories.fullName,
        installedAt: repositories.installedAt,
        reviewCount: count(reviews.id),
      })
      .from(repositories)
      .leftJoin(reviews, eq(reviews.repoId, repositories.id))
      .groupBy(repositories.id)
      .orderBy(desc(repositories.installedAt));

    res.json(repos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});
