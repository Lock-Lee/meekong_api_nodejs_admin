import { Router } from "express";
import authRouter from "./auth.routes";
import itemRouter from "./item.routes";
import categoryRouter from "./category.routes";
import brandRouter from "./brand.routes";
import satisfyRouter from "./satisfy.routes";
import auctionRouter from "./auction.routes";
import bidRouter from "./bid.routes";
import auctionParticipantRouter from "./auctionParticipant.routes";
import profileRouter from "./profile.routes";
import buyerAddressRouter from "./buyerAddress.routes"; // Import the new cart router
import buyerReviewRouter from "./buyerReview.routes"; // Import the new cart router
import cartRouter from "./cart.routes";
import buyerFavoriteRouter from "./buyerFavorite.routes";
import buyerReportRouter from "./buyerReport.routes";
import buyerOrderRouter from "./buyerOrder.routes";
import buyerPaymentRouter from "./buyerPayment.routes";
import sizeUnitRouter from "./sizeUnit.routes";
import v2Router from "./v2";

import otpRouter from "./otp.routes";
import BuyerShopRouter from "./buyerShop.routes";
import UserNotificationRouter from "./userNotification.routes";
import SellerShopRouter from "./sellerShop.routes";
import chatRouter from "./chat.router";
import shippingRouter from "./shipping.routes";

const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/item", itemRouter);
mainRouter.use("/categories", categoryRouter);
mainRouter.use("/size-unit", sizeUnitRouter);
mainRouter.use("/brand", brandRouter);
mainRouter.use("/satisfy", satisfyRouter);
mainRouter.use("/auction", auctionRouter);
mainRouter.use("/bids", bidRouter);
mainRouter.use("/auction-participants", auctionParticipantRouter);
mainRouter.use("/profile", profileRouter);
mainRouter.use("/cart", cartRouter); // Add the new cart router
mainRouter.use("/buyer-address", buyerAddressRouter);
mainRouter.use("/buyer-review", buyerReviewRouter);
mainRouter.use("/buyer-favorite", buyerFavoriteRouter);
mainRouter.use("/buyer-report", buyerReportRouter);
mainRouter.use("/buyer-order", buyerOrderRouter);
mainRouter.use("/buyer-payment", buyerPaymentRouter);

// API v2 (new surfaces; v1 routes remain unchanged)
mainRouter.use("/v2", v2Router);

mainRouter.use("/otp", otpRouter);
mainRouter.use("/buyer-shop", BuyerShopRouter);
mainRouter.use("/seller-shop", SellerShopRouter);
mainRouter.use('/chat', chatRouter);
mainRouter.use("/user-notification", UserNotificationRouter);
mainRouter.use("/shipping", shippingRouter);


export default mainRouter;
