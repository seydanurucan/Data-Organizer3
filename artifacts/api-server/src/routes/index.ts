import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import explainRouter from "./explain";
import favoritesRouter from "./favorites";
import quizRouter from "./quiz";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(explainRouter);
router.use(favoritesRouter);
router.use(quizRouter);
router.use(openaiRouter);

export default router;
