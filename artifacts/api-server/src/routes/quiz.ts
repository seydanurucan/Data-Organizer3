import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, quizScoresTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateQuizBody, SaveQuizScoreBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/quiz/generate", async (req, res): Promise<void> => {
  const parsed = GenerateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { term, language } = parsed.data;

  const langNote = language ? ` (${language} dilinde)` : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `Sen CodeBuddy. Kullanıcının kodlama bilgisini ölçmek için interaktif quiz soruları üretiyorsun. Her soru 4 şıklı çoktan seçmeli olmalı. JSON formatında yanıt ver. Emojis kullanma.`,
      },
      {
        role: "user",
        content: `"${term}"${langNote} konusunda 10 soruluk bir quiz hazırla. Sorular başlangıçtan ileri düzeye doğru gitsin. JSON formatı: {"term": "...", "questions": [{"id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(text);
  res.json(data);
});

router.get("/quiz/scores", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const scores = await db
    .select()
    .from(quizScoresTable)
    .where(eq(quizScoresTable.userId, userId))
    .orderBy(quizScoresTable.createdAt);
  res.json(scores);
});

router.post("/quiz/scores", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = SaveQuizScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [score] = await db
    .insert(quizScoresTable)
    .values({ ...parsed.data, userId })
    .returning();
  res.status(201).json(score);
});

export default router;
