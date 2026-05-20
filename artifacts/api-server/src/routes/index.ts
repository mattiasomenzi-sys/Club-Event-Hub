import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import storageRouter from "./storage";
import adminAuthRouter from "./admin-auth";
import participationsRouter from "./participations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(storageRouter);
router.use(adminAuthRouter);
router.use(participationsRouter);

export default router;
