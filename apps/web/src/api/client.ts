import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  prNumber: number;
  prTitle: string | null;
  prAuthor: string | null;
  prUrl: string | null;
  commitSha: string;
  status: "pending" | "processing" | "completed" | "failed";
  summary: string | null;
  filesChanged: number | null;
  createdAt: string;
  completedAt: string | null;
  repoFullName: string | null;
}

export interface Comment {
  id: number;
  reviewId: number;
  filePath: string;
  lineNumber: number | null;
  severity: "bug" | "security" | "improvement" | "style" | "info";
  body: string;
  createdAt: string;
}

export interface ReviewDetail extends Review {
  errorMessage: string | null;
  comments: Comment[];
}

export interface Stats {
  totalReviews: number;
  totalComments: number;
  avgCommentsPerReview: number;
  severityBreakdown: Record<string, number>;
  reviewsOverTime: Array<{ date: string; count: number }>;
}

export interface Repo {
  id: number;
  fullName: string;
  installedAt: string;
  reviewCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const apiClient = {
  getReviews: async (page = 1, limit = 20): Promise<PaginatedResponse<Review>> => {
    const { data } = await api.get(`/reviews?page=${page}&limit=${limit}`);
    return data;
  },

  getReview: async (id: number): Promise<ReviewDetail> => {
    const { data } = await api.get(`/reviews/${id}`);
    return data;
  },

  getStats: async (): Promise<Stats> => {
    const { data } = await api.get("/reviews/stats/summary");
    return data;
  },

  getRepos: async (): Promise<Repo[]> => {
    const { data } = await api.get("/reviews/repos/list");
    return data;
  },
};
