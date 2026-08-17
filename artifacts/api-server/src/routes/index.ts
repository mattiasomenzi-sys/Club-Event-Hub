import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import storageRouter from "./storage";
import adminAuthRouter from "./admin-auth";
import participationsRouter from "./participations";
import galleryRouter from "./gallery";
import bannersRouter from "./banners";
import analyticsRouter from "./analytics";
import profilesRouter from "./profiles";
import adminEmailRouter from "./admin-email";
import invitesRouter from "./invites";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(storageRouter);
router.use(adminAuthRouter);
router.use(participationsRouter);
router.use(galleryRouter);
router.use(bannersRouter);
router.use(analyticsRouter);
router.use(profilesRouter);
router.use(adminEmailRouter);
router.use(invitesRouter);

export default router;
