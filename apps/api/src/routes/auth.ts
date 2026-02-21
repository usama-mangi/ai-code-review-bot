import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { env } from "../config/env.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const authRouter: Router = Router();

// Define cookie options for sessions
const isHttps = env.FRONTEND_URL.startsWith("https://");

const cookieOptions = {
  httpOnly: true,
  secure: isHttps,
  sameSite: "lax" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};

// 1. Redirect to GitHub for Authentication
authRouter.get("/github", (_req: Request, res: Response) => {
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  
  // Note: For a standard GitHub App (not an OAuth app), you usually don't 
  // request specific scopes because the app permissions are configured on GitHub.
  
  res.redirect(githubAuthUrl.toString());
});

// 2. Handle GitHub Callback
authRouter.get("/github/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  
  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    // Exchange code for Access Token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = (await userResponse.json()) as any;

    // Upsert User in Database
    const [dbUser] = await db
      .insert(users)
      .values({
        githubId: githubUser.id,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        email: githubUser.email,
      })
      .onConflictDoUpdate({
        target: users.githubId,
        set: {
          username: githubUser.login,
          avatarUrl: githubUser.avatar_url,
          email: githubUser.email,
        },
      })
      .returning();

    // Create a new session
    const sessionId = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);

    await db.insert(sessions).values({
      id: sessionId,
      userId: dbUser.id,
      expiresAt,
    });

    // Set cookie and redirect to dashboard
    res.cookie("session", sessionId, cookieOptions);
    res.redirect(`${env.FRONTEND_URL}/`);
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

// 4. Logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session;
  
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  
  res.clearCookie("session", {
    path: "/",
    secure: isHttps,
    sameSite: "lax",
  });
  
  res.json({ success: true });
});
