CREATE TABLE "visualizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"prompt" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"data" jsonb NOT NULL,
	"spec" jsonb NOT NULL,
	"sources" jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visualizations" ADD CONSTRAINT "visualizations_parent_id_visualizations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."visualizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "published_feed_idx" ON "visualizations" USING btree ("published_at" DESC NULLS LAST) WHERE "visualizations"."is_published" = true;