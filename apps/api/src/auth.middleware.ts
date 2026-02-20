import { Request, Response, NextFunction } from "express";
import { db } from "./db/index.js";
import { sessions, users } from "./db/schema.js";
import { eq } from "drizzle-orm";

// Extend Express Request type to include the user
declare global {
  namespace Express {
    interface Request {
      user?: typeof users.$inferSelect;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized: No session token" });
  }

  try {
    // Look up the session and join with user
    const sessionRecord = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        user: true,
      },
    });

    if (!sessionRecord) {
      return res.status(401).json({ error: "Unauthorized: Invalid session" });
    }

    // Check if session has expired
    if (new Date() > sessionRecord.expiresAt) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return res.status(401).json({ error: "Unauthorized: Session expired" });
    }

    // Attach user to the request
    req.user = sessionRecord.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};
