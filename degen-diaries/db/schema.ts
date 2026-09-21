import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    issueNumber: integer("issue_number").notNull().unique(),
    editionDate: timestamp("edition_date", { withTimezone: true }).notNull(),
    edition: text("edition").notNull(),
    status: text("status").notNull().default("draft"),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [index("issues_status_idx").on(table.status)]
);

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    issueId: uuid("issue_id").references(() => issues.id, { onDelete: "set null" }),
    section: text("section").notNull(),
    articleType: text("article_type").notNull(),
    headline: text("headline").notNull(),
    dek: text("dek"),
    body: text("body").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("draft"),
    sourceUrl: text("source_url").notNull(),
    sourceTitle: text("source_title"),
    sourcePublisher: text("source_publisher"),
    sourcePublishedAt: timestamp("source_published_at", { withTimezone: true }),
    facts: jsonb("facts").$type<string[]>().default([]).notNull(),
    editorialNotes: jsonb("editorial_notes").$type<string[]>().default([]).notNull(),
    imageUrl: text("image_url"),
    pageNumber: integer("page_number"),
    featured: boolean("featured").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("stories_issue_idx").on(table.issueId),
    index("stories_section_idx").on(table.section),
    index("stories_status_idx").on(table.status),
    uniqueIndex("stories_slug_idx").on(table.slug),
  ]
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storyId: uuid("story_id").references(() => stories.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    publisher: text("publisher"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sourceType: text("source_type").notNull().default("web"),
    rawExcerpt: text("raw_excerpt"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sources_story_idx").on(table.storyId)]
);

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").unique(),
    email: text("email").notNull(),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    status: text("status").notNull().default("inactive"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("subscribers_status_idx").on(table.status)]
);
