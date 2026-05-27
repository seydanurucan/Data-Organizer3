import { Router, type IRouter } from "express";
import { db, favoritesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddFavoriteBody, RemoveFavoriteParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const favorites = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.userId, userId))
    .orderBy(favoritesTable.createdAt);
  res.json(favorites);
});

router.post("/favorites", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fav] = await db
    .insert(favoritesTable)
    .values({ ...parsed.data, userId })
    .returning();
  res.status(201).json(fav);
});

router.delete("/favorites/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = RemoveFavoriteParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.id, params.data.id), eq(favoritesTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Favorite not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
