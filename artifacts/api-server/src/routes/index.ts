import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import walletRouter from "./wallet";
import gamesRouter from "./games";
import leaderboardRouter from "./leaderboard";
import profileRouter from "./profile";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(walletRouter);
router.use(gamesRouter);
router.use(leaderboardRouter);
router.use(profileRouter);
router.use(adminRouter);

export default router;
