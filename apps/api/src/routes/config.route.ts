import { Router, type Request, type Response } from "express";
import { db } from "../db/index.js";
import { repositories } from "../db/schema.js";
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

    // 3. Fetch from our DB to get 'enabled' status
    const dbRepos = await db.select().from(repositories);
    const dbRepoMap = new Map();
    for (const r of dbRepos) {
      dbRepoMap.set(r.githubId, r);
    }

    // 4. Merge
    const result = allGithubRepos.map((r) => {
      const dbRepo = dbRepoMap.get(r.githubId);
      return {
        githubId: r.githubId,
        fullName: r.fullName,
        installationId: r.installationId,
        enabled: dbRepo ? dbRepo.enabled : true, // Default to true
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
      // Create it with the supplied details
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
