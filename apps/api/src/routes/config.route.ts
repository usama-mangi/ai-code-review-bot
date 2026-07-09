import { Router, type Request, type Response } from "express";
import { db } from "../db/index.js";
import { repositories, repoConfigs } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const configRouter: Router = Router();

// Get user's available repositories
configRouter.get("/repositories", async (req: Request, res: Response) => {
  if (!req.user || !req.user.accessToken) {
    return res.status(401).json({ error: "Unauthorized or missing GitHub token. Please re-login." });
  }

  try {
    const accessToken = req.user.accessToken;

    // 1. Fetch user installations
    const installationsRes = await fetch("https://api.github.com/user/installations", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!installationsRes.ok) {
      throw new Error(`Failed to fetch installations: ${installationsRes.statusText}`);
    }

    const installationsData = (await installationsRes.json()) as any;
    const installations = installationsData.installations || [];

    // 2. Fetch repositories for each installation
    let allGithubRepos: any[] = [];
    for (const inst of installations) {
      const reposRes = await fetch(
        `https://api.github.com/user/installations/${inst.id}/repositories`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (reposRes.ok) {
        const reposData = (await reposRes.json()) as any;
        const repos = reposData.repositories || [];
        allGithubRepos = allGithubRepos.concat(
          repos.map((r: any) => ({
            githubId: r.id,
            fullName: r.full_name,
            installationId: inst.id,
          }))
        );
      }
    }

    // 3. Fetch from our DB to get 'enabled' status and config
    const dbRepos = await db.select().from(repositories);
    const dbRepoMap = new Map();
    for (const r of dbRepos) {
      dbRepoMap.set(r.githubId, r);
    }

    // 4. Fetch repo configs
    const dbConfigs = await db.select().from(repoConfigs);
    const configMap = new Map();
    for (const c of dbConfigs) {
      configMap.set(c.repoId, c);
    }

    // 5. Merge
    const result = allGithubRepos.map((r) => {
      const dbRepo = dbRepoMap.get(r.githubId);
      const config = dbRepo ? configMap.get(dbRepo.id) : null;
      return {
        githubId: r.githubId,
        fullName: r.fullName,
        installationId: r.installationId,
        enabled: dbRepo ? dbRepo.enabled : true,
        config: config ? {
          minSeverity: config.minSeverity,
          maxComments: config.maxComments,
          reviewDraftPrs: config.reviewDraftPrs,
          excludePatterns: config.excludePatterns,
          includeOnlyPatterns: config.includeOnlyPatterns,
          customInstructions: config.customInstructions,
          notifyOnCompletion: config.notifyOnCompletion,
          notifySlackWebhook: config.notifySlackWebhook,
          notifyEmails: config.notifyEmails,
        } : null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Failed to fetch config repositories:", err);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// Toggle repository enabled state
configRouter.post("/repositories/:githubId/toggle", async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const githubId = parseInt(req.params.githubId, 10);
  const { enabled, fullName, installationId } = req.body;

  try {
    const [existing] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.githubId, githubId))
      .limit(1);

    if (existing) {
      await db
        .update(repositories)
        .set({ enabled })
        .where(eq(repositories.githubId, githubId));
    } else {
      if (!fullName || !installationId) {
        return res.status(400).json({ error: "Missing fullName or installationId for new repo" });
      }
      await db.insert(repositories).values({
        githubId,
        fullName,
        installationId,
        enabled,
      });
    }

    res.json({ success: true, enabled });
  } catch (err) {
    console.error("Failed to toggle repository:", err);
    res.status(500).json({ error: "Failed to toggle repository" });
  }
});

// ─── Repository Config CRUD ──────────────────────────────────────────────────

// GET /api/config/repositories/:repoId/config — get repo config
configRouter.get("/repositories/:repoId/config", async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const repoId = parseInt(req.params.repoId, 10);

  try {
    const [config] = await db
      .select()
      .from(repoConfigs)
      .where(eq(repoConfigs.repoId, repoId))
      .limit(1);

    if (!config) {
      return res.json({
        minSeverity: "info",
        maxComments: 15,
        reviewDraftPrs: false,
        excludePatterns: null,
        includeOnlyPatterns: null,
        customInstructions: null,
        notifyOnCompletion: false,
        notifySlackWebhook: null,
        notifyEmails: null,
      });
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch repo config" });
  }
});

// PUT /api/config/repositories/:repoId/config — upsert repo config
configRouter.put("/repositories/:repoId/config", async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const repoId = parseInt(req.params.repoId, 10);
  const {
    minSeverity,
    maxComments,
    reviewDraftPrs,
    excludePatterns,
    includeOnlyPatterns,
    customInstructions,
    notifyOnCompletion,
    notifySlackWebhook,
    notifyEmails,
  } = req.body;

  try {
    const [existing] = await db
      .select()
      .from(repoConfigs)
      .where(eq(repoConfigs.repoId, repoId))
      .limit(1);

    if (existing) {
      await db
        .update(repoConfigs)
        .set({
          minSeverity: minSeverity ?? existing.minSeverity,
          maxComments: maxComments ?? existing.maxComments,
          reviewDraftPrs: reviewDraftPrs ?? existing.reviewDraftPrs,
          excludePatterns: excludePatterns ?? existing.excludePatterns,
          includeOnlyPatterns: includeOnlyPatterns ?? existing.includeOnlyPatterns,
          customInstructions: customInstructions ?? existing.customInstructions,
          notifyOnCompletion: notifyOnCompletion ?? existing.notifyOnCompletion,
          notifySlackWebhook: notifySlackWebhook ?? existing.notifySlackWebhook,
          notifyEmails: notifyEmails ?? existing.notifyEmails,
          updatedAt: new Date(),
        })
        .where(eq(repoConfigs.repoId, repoId));
    } else {
      await db.insert(repoConfigs).values({
        repoId,
        minSeverity: minSeverity ?? "info",
        maxComments: maxComments ?? 15,
        reviewDraftPrs: reviewDraftPrs ?? false,
        excludePatterns: excludePatterns ?? null,
        includeOnlyPatterns: includeOnlyPatterns ?? null,
        customInstructions: customInstructions ?? null,
        notifyOnCompletion: notifyOnCompletion ?? false,
        notifySlackWebhook: notifySlackWebhook ?? null,
        notifyEmails: notifyEmails ?? null,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to update repo config:", err);
    res.status(500).json({ error: "Failed to update repo config" });
  }
});
