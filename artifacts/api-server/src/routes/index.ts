import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import storageRouter from "./storage";
import adminAuthRouter from "./admin-auth";
import participationsRouter from "./participations";
import galleryRouter from "./gallery";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(storageRouter);
router.use(adminAuthRouter);
router.use(participationsRouter);
router.use(galleryRouter);
router.use(analyticsRouter);

export default router;
