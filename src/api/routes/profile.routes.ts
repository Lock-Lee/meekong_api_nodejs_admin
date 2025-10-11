import BaseRouter, { RouteConfig } from "./router";
import { ProfileController } from "../controllers/profile.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { container } from "../../main/inversify.config";
import { TYPES } from "../../shared/types/service.types";

class ProfileRouter extends BaseRouter {
    private readonly profileController: ProfileController;

    constructor() {
        super();
        this.profileController = container.get<ProfileController>(TYPES.ProfileController);
    }

    protected routes(): RouteConfig[] {
        return [
            {
                /**
                 * @swagger
                 * /api/profile/{id}:
                 *   get:
                 *     tags: [Profile]
                 *     summary: Get user profile by ID
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: User ID
                 *     responses:
                 *       200:
                 *         description: Successful operation
                 *       404:
                 *         description: Profile not found
                 *       401:
                 *         description: Unauthorized
                 */
                method: "get",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.profileController.getById.bind(this.profileController),
            },
            {
                /**
                 * @swagger
                 * /api/profile/{id}:
                 *   put:
                 *     tags: [Profile]
                 *     summary: Update user profile
                 *     security:
                 *       - bearerAuth: []
                 *     parameters:
                 *       - in: path
                 *         name: id
                 *         required: true
                 *         schema:
                 *           type: string
                 *           format: uuid
                 *         description: User ID
                 *     requestBody:
                 *       required: true
                 *       content:
                 *         multipart/form-data:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               firstName:
                 *                 type: string
                 *                 description: ชื่อ
                 *               lastName:
                 *                 type: string
                 *                 description: นามสกุล
                 *               email:
                 *                 type: string
                 *                 format: email
                 *                 description: อีเมล
                 *               phone:
                 *                 type: string
                 *                 description: เบอร์โทรศัพท์
                 *               gender:
                 *                 type: string
                 *                 enum: [MALE, FEMALE, OTHER]
                 *                 description: เพศ
                 *               birthDate:
                 *                 type: string
                 *                 format: date-time
                 *                 description: วันเกิด (ISO 8601 format)
                 *               image:
                 *                 type: string
                 *                 format: binary
                 *                 description: รูปโปรไฟล์ (JPEG, PNG, WebP, max 5MB)
                 *         application/json:
                 *           schema:
                 *             type: object
                 *             properties:
                 *               firstName:
                 *                 type: string
                 *                 description: ชื่อ
                 *               lastName:
                 *                 type: string
                 *                 description: นามสกุล
                 *               email:
                 *                 type: string
                 *                 format: email
                 *                 description: อีเมล
                 *               phone:
                 *                 type: string
                 *                 description: เบอร์โทรศัพท์
                 *               gender:
                 *                 type: string
                 *                 enum: [MALE, FEMALE, OTHER]
                 *                 description: เพศ
                 *               birthDate:
                 *                 type: string
                 *                 format: date-time
                 *                 description: วันเกิด (ISO 8601 format)
                 *     responses:
                 *       200:
                 *         description: Profile updated successfully
                 *       400:
                 *         description: Invalid input
                 *       401:
                 *         description: Unauthorized
                 *       404:
                 *         description: Profile not found
                 */
                method: "put",
                path: "/:id",
                middlewares: [AuthMiddleware.authenticateUser],
                handler: this.profileController.update.bind(this.profileController),
            },
        ];
    }
}

export default new ProfileRouter().router;