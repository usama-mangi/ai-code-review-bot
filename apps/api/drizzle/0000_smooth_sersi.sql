CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"file_path" text NOT NULL,
	"line_number" integer,
	"diff_position" integer,
	"severity" text DEFAULT 'info' NOT NULL,
	"body" text NOT NULL,
	"github_comment_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" bigint NOT NULL,
	"full_name" text NOT NULL,
	"installation_id" bigint NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"repo_id" integer NOT NULL,
	"pr_number" integer NOT NULL,
	"pr_title" text,
	"pr_author" text,
	"pr_url" text,
	"commit_sha" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"summary" text,
	"files_changed" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" bigint NOT NULL,
	"username" text NOT NULL,
	"avatar_url" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pr_commit" ON "reviews" USING btree ("repo_id","pr_number","commit_sha");