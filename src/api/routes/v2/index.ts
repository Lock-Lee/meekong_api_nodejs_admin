import { Router } from "express";
import itemsV2Router from "./item.v2.routes";
import mediaRouter from "./media.routes";

const v2Router = Router();

v2Router.use("/items", itemsV2Router);
v2Router.use("/media", mediaRouter);

export default v2Router;


