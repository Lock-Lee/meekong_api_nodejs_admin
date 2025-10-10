import BaseRouter, { RouteConfig } from "./router";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";
import TagController from "@api/controllers/tags.controller";

class TagsRouter extends BaseRouter {
    private readonly tagController: TagController;

    constructor() {
        super();
        this.tagController = container.get<TagController>(TYPES.TagController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/tags/:
                 *   get:
                 *     tags: [Tags]
                 *     summary: Get all tags
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 */
                method: "get",
                path: "/",
                handler: this.tagController.getAll.bind(this.tagController),
            },
            {
                /**
                 * @swagger
                 * /api/tags/{id}:
                 *   get:
                 *     tags: [Tags]
                 *     summary: Get category by ID
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *         description: Category ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *       404:
                 *         description: Category not found
                 */
                method: "get",
                path: "/:id",
                handler: this.tagController.getById.bind(this.tagController),
            },
            {
                /**
                 * @swagger
                 * /api/tags:
                 *   post:
                 *     tags: [Tags]
                 *     summary: Create a new tag
                 *     operationId: createTag
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               name:
                 *                 type: string
                 *                 example: "เสื้อยืดทรงสวย"
                 *               tagLinks:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       format: uuid
                 *                 description: Connect existing TagLink by id
                 *                 example:
                 *                   - { "id": "1f7e1b60-8f66-4e7f-a2a5-2c2a9a1e3af3" }
                 *                   - { "id": "9c9b2b5f-7b8a-4d3a-90a7-7a9c1fc2e1d2" }
                 *               TagUsage:
                 *                 type: array
                 *                 items:
                 *                   type: object
                 *                   properties:
                 *                     id:
                 *                       type: string
                 *                       format: uuid
                 *                 description: Connect existing TagUsage by id
                 *                 example:
                 *                   - { "id": "e0e1f2a3-b4c5-46d7-9e8f-1a2b3c4d5e6f" }
                 *           examples:
                 *             basic:
                 *               summary: Minimal create
                 *               value:
                 *                 name: "สินค้าใหม่"
                 *             withRelations:
                 *               summary: Create and connect relations
                 *               value:
                 *                 name: "เสื้อยืดทรงสวย"
                 *                 tagLinks:
                 *                   - { id: "1f7e1b60-8f66-4e7f-a2a5-2c2a9a1e3af3" }
                 *                 TagUsage:
                 *                   - { id: "e0e1f2a3-b4c5-46d7-9e8f-1a2b3c4d5e6f" }
                 *     responses:
                 *       201:
                 *         description: Tag created successfully
                 *         content:
                 *           application/json:
                 *             schema:
                 *               type: object
                 *               properties:
                 *                 id:
                 *                   type: string
                 *                   format: uuid
                 *                 name:
                 *                   type: string
                 *                 createdById:
                 *                   type: string
                 *                   nullable: true
                 *                 categoryId:
                 *                   type: string
                 *                   nullable: true
                 *                 tagLinks:
                 *                   type: array
                 *                   items:
                 *                     type: object
                 *                     properties:
                 *                       id:
                 *                         type: string
                 *                 tagUsages:
                 *                   type: array
                 *                   items:
                 *                     type: object
                 *                     properties:
                 *                       id:
                 *                         type: string
                 *             examples:
                 *               created:
                 *                 value:
                 *                   id: "7b2f6f0b-1a22-4c3d-9f0b-123456789abc"
                 *                   name: "เสื้อยืดทรงสวย"
                 *                   createdById: null
                 *                   categoryId: null
                 *                   tagLinks:
                 *                     - { "id": "1f7e1b60-8f66-4e7f-a2a5-2c2a9a1e3af3" }
                 *                   tagUsages:
                 *                     - { "id": "e0e1f2a3-b4c5-46d7-9e8f-1a2b3c4d5e6f" }
                 *       400:
                 *         description: Invalid input
                 *       409:
                 *         description: Tag name already exists
                 */
                method: "post",
                path: "/",
                handler: this.tagController.create.bind(this.tagController),
            }

        ];
    }
}

export default new TagsRouter().router;
