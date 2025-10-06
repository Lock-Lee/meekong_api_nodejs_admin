import BaseRouter, { RouteConfig } from "./router";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import { SizeUnitController } from "@controllers/sizeUnit.controller";



class SizeUnitRouter extends BaseRouter {
    private readonly sizeUnitController: SizeUnitController;

    constructor() {
        super();
        this.sizeUnitController = container.get<SizeUnitController>(TYPES.SizeUnitController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/size-unit:
                 *   get:
                 *     tags: [Size Unit]
                 *     summary: Get all size units by category
                 *     parameters:
                 *       - in: query
                 *         name: categoryId
                 *         schema:
                 *           type: string
                 *         required: true
                 *         description: Category ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/",
                handler: this.sizeUnitController.getSizeUnitByCategory.bind(this.sizeUnitController),
            },
        ];
    }
}

export default new SizeUnitRouter().router;