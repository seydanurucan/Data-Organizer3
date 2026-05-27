import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const quizScoresTable = pgTable("quiz_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuizScoreSchema = createInsertSchema(quizScoresTable).omit({ id: true, createdAt: true });
export type InsertQuizScore = z.infer<typeof insertQuizScoreSchema>;
export type QuizScore = typeof quizScoresTable.$inferSelect;
