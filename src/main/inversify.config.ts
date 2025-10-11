import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "../shared/types/service.types";

// Item Interfaces
import {
    IItemService,
    ITagService,
    IItemRepository
} from "../business/interfaces/item.interfaces";

// File Interfaces
import { IFileService, IFileRepository } from "../business/interfaces/file.interfaces";

// Tag Interfaces
import { ITagRepository } from "../business/interfaces/tag.interfaces";

// Bid Interfaces
import { IBidService, IBidRepository } from "../business/interfaces/bid.interfaces";

// Brand Interfaces
import { IBrandService, IBrandRepository } from "../business/interfaces/brand.interfaces";

// Category Interfaces
import { ICategoryService, ICategoryRepository } from "../business/interfaces/category.interfaces";

// Profile Interfaces
import { IProfileService, IProfileRepository } from "../business/interfaces/profile.interfaces";

// Shop Interfaces
import { IShopService, IShopRepository } from "../business/interfaces/shop.interfaces";

// Auction Interfaces
import { IAuctionService, IAuctionRepository } from "../business/interfaces/auction.interfaces";

// AuctionParticipant Interfaces
import { IAuctionParticipantService, IAuctionParticipantRepository } from "../business/interfaces/auction-participant.interfaces";
import { ICartService } from "../business/interfaces/cart.interfaces";

// Auth Interfaces
import {
    IAuthService,
    ITokenService,
    IUserRepository,
    IRefreshSessionRepository
} from "../business/interfaces/auth.interfaces";
//buyerAddress Interfaces
import { IBuyerAddressService, IBuyerAddressRepository } from "../business/interfaces/buyer-address.interfaces";
//buyerReview Interfaces
import { IBuyerReviewService, IBuyerReviewRepository } from "../business/interfaces/buyer-review.interfaces";
//buyerOrder Interfaces
import { IBuyerOrderService, IBuyerOrderRepository } from "../business/interfaces/buyer-order.interfaces";


import { ISizeUnitService, ISizeUnitRepository } from "../business/interfaces/size-unit.interfaces";

// Inventory Interfaces
import { IInventoryService, IInventoryRepository } from "../business/interfaces/inventory.interfaces";


// Item Implementations
import { ItemService } from "../business/services/item.service";
import { TagService } from "../business/services/tag.service";
import { FileService } from "../business/services/file.service";
import { ItemRepository } from "../data/repositories/item.repository";
import { TagRepository } from "../data/repositories/tag.repository";
import { FileRepository } from "../data/repositories/file.repository";

// Auction Implementations
import { AuctionService } from "../business/services/auction.service";
import { AuctionRepository } from "../data/repositories/auction.repository";

// Bid Implementations
import { BidService } from "../business/services/bid.service";
import { BidRepository } from "../data/repositories/bid.repository";

// Brand Implementations
import { BrandService } from "../business/services/brand.service";
import { BrandRepository } from "../data/repositories/brand.repository";

// Category Implementations
import { CategoryService } from "../business/services/category.service";
import { CategoryRepository } from "../data/repositories/category.repository";

// Profile Implementations
import { ProfileService } from "../business/services/profile.service";
import { ProfileRepository } from "../data/repositories/profile.repository";

// Shop Implementations
import { ShopService } from "../business/services/shop.service";
import { ShopRepository } from "../data/repositories/shop.repository";

// AuctionParticipant Implementations
import { AuctionParticipantService } from "../business/services/auction-participant.service";
import { AuctionParticipantRepository } from "../data/repositories/auction-participant.repository";

// Auth Implementations
import { AuthService } from "../business/services/auth.service";
import { TokenService } from "../business/services/token.service";
import { UserRepository } from "../data/repositories/user.repository";
import { RefreshSessionRepository } from "../data/repositories/refresh-session.repository";

// Cart Implementations
import { CartService } from "../business/services/cart.service";

// BuyerAddress Implementations
import { BuyerAddressService } from "../business/services/buyer-address.service";
import { BuyerAddressRepository } from "../data/repositories/buyer-address.repository";

// BuyerReview Implementations
import { BuyerReviewService } from "../business/services/buyer-review.service";
import { BuyerReviewRepository } from "../data/repositories/buyer-review.repository";

//BuyerPayment Implementations
import { BuyerPaymentService } from "../business/services/buyer-payment.service";
import { BuyerPaymentRepository } from "../data/repositories/buyer-payment.repository";

//BuyerOrder Implementations
import { BuyerOrderService } from "../business/services/buyer-order.service";
import { BuyerOrderRepository } from "../data/repositories/buyer-order.repository";

//BuyerReport Implementations
import { BuyerReportService } from "../business/services/buyer-report.service";
import { BuyerReportRepository } from "../data/repositories/buyer-report.repository";

// Inventory Implementations
import { InventoryService } from "../business/services/inventory.service";
import { InventoryRepository } from "../data/repositories/inventory.repository";


// BuyerShop Implementations
import { BuyerShopService } from "@business/services/buyer-shop.service";
import { BuyerShopRepository } from "@data/repositories/buyer-shop.repository";

//SellerShop Implementations
import { SellerShopService } from "@business/services/seller-shop.service";
import { SellerShopRepository } from "@data/repositories/seller-shop.repository";

// Database
import { prisma } from "../data/database/db";

// Controllers
import { CartController } from "../api/controllers/cart.controller";
import { AuctionParticipantController } from "../api/controllers/auctionParticipant.controller";
import { ItemController } from "../api/controllers/item.controller";
import { BrandController } from "../api/controllers/brand.controller";
import { AuthController } from "../api/controllers/auth.controller";
import { BidController } from "../api/controllers/bid.controller";
import { AuctionController } from "../api/controllers/auction.controller";
import { CategoryController } from "../api/controllers/category.controller";
import { ProfileController } from "../api/controllers/profile.controller";
import { ShopController } from "../api/controllers/shop.controller";
import { SatisfyController } from "../api/controllers/satisfy.controller";
import { BuyerAddressController } from "../api/controllers/buyerAddress.controller";
import { BuyerReviewController } from "../api/controllers/buyerReview.controller";
import { BuyerFavoriteController } from "../api/controllers/buyerFavorite.controller";
import { BuyerOrderController } from "../api/controllers/buyerOrder.controller";
import { BuyerReportController } from "@api/controllers/buyerReport.controller";
import { SizeUnitController } from "@api/controllers/sizeUnit.controller";
import { OTPController } from "@api/controllers/opt.controller";
import { BuyerShopController } from "@api/controllers/buyerShop.controller";
import { UserNotificationController } from "@api/controllers/userNotifition.controller";
import { SellerShopController } from "@api/controllers/sellerShop.controller";
import { BuyerCheckoutController } from "@api/controllers/buyerCheckout.controller";


// Import missing services and repositories
import { SatisfyService } from "../business/services/satisfy.service";
import { SatisfyRepository } from "../data/repositories/satisfy.repository";
import { ISatisfyService, ISatisfyRepository } from "../business/interfaces/satisfy.interfaces";
import { IBuyerFavoriteRepository, IBuyerFavoriteService } from "@business/interfaces/buyer-favorite.interfaces";
import { BuyerFavoriteService } from "@business/services/buyer-favorite.service";
import { BuyerFavoriteRepository } from "@data/repositories/buyer-favorite.repository";
import { IBuyerPaymentRepository, IBuyerPaymentService } from "@business/interfaces/buyer-payment.interfaces";
import getOmiseClient, { OmiseClient } from "@shared/infra/omise/omise.client";
import { BuyerPaymentController } from "@api/controllers/buyerPayment.controller";
import { IBuyerReportRepository, IBuyerReportService } from "@business/interfaces/buyer-report.interfaces";
import { SizeUnitService } from "@business/services/size-unit.service";
import { SizeUnitRepository } from "@data/repositories/size-unit.repository";
import { MediaRepository } from "../data/repositories/media.repository";
import { MediaService } from "../business/services/media.service";
import MediaController from "../api/controllers/v2/media.controller";
import ItemControllerV2 from "../api/controllers/v2/item.controller.v2";
import { S3PresignService } from "../shared/infra/aws/s3.presign.service";
import { createS3Client } from "../shared/infra/aws/s3.client";
import { OTPService } from "@business/services/otp.service";
import { IBuyerShopRepository, IBuyerShopService } from "@business/interfaces/buyer-shop.intetfaces";
import { NotificationService } from "@business/services/notification.service";
import { NotificationController } from "@api/controllers/notifition.controller";
import { UserNotificationService } from "@business/services/user-notification.service";
import { NotificationRepository } from "@data/repositories/notification.repository";
import { UserNotificationRepository } from "@data/repositories/user-notification.repository";

import { INotificationRepository } from "@business/interfaces/notification.interfaces";
import { IUserNotificationRepository } from "@business/interfaces/user-notification.interfaces";

import { ISellerShopRepository, ISellerShopService } from "@business/interfaces/seller-shop.intetfaces";
import { IBuyerCheckoutRepository, IBuyerCheckoutService } from "@business/interfaces/buyer-checkout.interfaces";
import { BuyerCheckoutService } from "@business/services/buyer-checkout.service";
import { BuyerCheckoutRepository } from "@data/repositories/buyer-checkout.repository";

// BuyerCheckout Implementations

// Chat Interfaces
import { IChatRepository, IChatService } from '@business/interfaces/chat.interfaces';

// RFQ Interfaces
import { IRFQService, IRFQRepository } from '../business/interfaces/rfq.interfaces';

// Chat Implementations
import { ChatService } from '@business/services/chat.service';

// RFQ Implementations
import { RFQService } from '../business/services/rfq.service';
import { RFQRepository } from '../data/repositories/rfq.repository';

// Controllers
import { ChatController } from '@api/controllers/chat.controller';
import { SocketService } from "@shared/infra/socket/socket.service";
import { ChatRepository } from "@data/repositories/chat.repository";
import { IOTPRepository, IOTPService } from "@business/interfaces/otp.interfaces";
import { OTPRepository } from "@data/repositories/otp.repository";

// Shipping Interfaces
import { IshippingRepository, IshippingService } from "@business/interfaces/shipping.interfaces";

// Shipping Implementations
import { ShippingService } from "@business/services/shipping.service";
import { ShippingRepository } from "@data/repositories/shipping.repository";
import { ShippingController } from "@api/controllers/shipping.controller";
import TagController from "@api/controllers/tags.controller";
import { RFQController } from '../api/controllers/rfq.controller';

/**
 * Inversify Container Configuration
 * This configures all dependency injection bindings
 */
const container = new Container({
    defaultScope: "Singleton", // Most services should be singletons
});

// Bind Database
container.bind<typeof prisma>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<OmiseClient>(TYPES.OmiseClient).toConstantValue(
    getOmiseClient({
        secretKey: process.env.OMISE_SECRET_KEY!,
        publicKey: process.env.OMISE_PUBLIC_KEY!,
    })
);

// Bind Repositories
container.bind<IItemRepository>(TYPES.ItemRepository).to(ItemRepository);
container.bind<IAuctionRepository>(TYPES.AuctionRepository).to(AuctionRepository);
container.bind<ITagRepository>(TYPES.TagRepository).to(TagRepository);
container.bind<IFileRepository>(TYPES.FileRepository).to(FileRepository);
container.bind<IBidRepository>(TYPES.BidRepository).to(BidRepository);
container.bind<IBrandRepository>(TYPES.BrandRepository).to(BrandRepository);
container.bind<ICategoryRepository>(TYPES.CategoryRepository).to(CategoryRepository);
container.bind<IProfileRepository>(TYPES.ProfileRepository).to(ProfileRepository);
container.bind<IShopRepository>(TYPES.ShopRepository).to(ShopRepository);
container.bind<IAuctionParticipantRepository>(TYPES.AuctionParticipantRepository).to(AuctionParticipantRepository);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<IRefreshSessionRepository>(TYPES.RefreshSessionRepository).to(RefreshSessionRepository);
container.bind<IBuyerAddressRepository>(TYPES.BuyerAddressRepository).to(BuyerAddressRepository);
container.bind<IBuyerReviewRepository>(TYPES.BuyerReviewRepository).to(BuyerReviewRepository);
container.bind<IBuyerFavoriteRepository>(TYPES.BuyerFavoriteRepository).to(BuyerFavoriteRepository);
container.bind<IBuyerOrderRepository>(TYPES.BuyerOrderRepository).to(BuyerOrderRepository);
container.bind<IBuyerPaymentRepository>(TYPES.BuyerPaymentRepository).to(BuyerPaymentRepository);
container.bind<IBuyerReportRepository>(TYPES.BuyerReportRepository).to(BuyerReportRepository);
container.bind<ISizeUnitRepository>(TYPES.SizeUnitRepository).to(SizeUnitRepository);
container.bind<IInventoryRepository>(TYPES.InventoryRepository).to(InventoryRepository);
container.bind<IOTPRepository>(TYPES.OTPRepository).to(OTPRepository);
container.bind<IBuyerShopRepository>(TYPES.BuyerShopRepository).to(BuyerShopRepository);
container.bind<INotificationRepository>(TYPES.NotificationRepository).to(NotificationRepository);
container.bind<IUserNotificationRepository>(TYPES.UserNotificationRepository).to(UserNotificationRepository);
container.bind<ISellerShopRepository>(TYPES.SellerShopRepository).to(SellerShopRepository);
container.bind<IChatRepository>(TYPES.ChatRepository).to(ChatRepository);
container.bind<IshippingRepository>(TYPES.ShippingRepository).to(ShippingRepository);
container.bind<IRFQRepository>(TYPES.RFQRepository).to(RFQRepository);
container.bind<IBuyerCheckoutRepository>(TYPES.BuyerCheckoutRepository).to(BuyerCheckoutRepository);


// Bind Services
container.bind<IItemService>(TYPES.ItemService).to(ItemService);
container.bind<IAuctionService>(TYPES.AuctionService).to(AuctionService);
container.bind<ITagService>(TYPES.TagService).to(TagService);
container.bind<IFileService>(TYPES.FileService).to(FileService);
container.bind<IBidService>(TYPES.BidService).to(BidService);
container.bind<IBrandService>(TYPES.BrandService).to(BrandService);
container.bind<ICategoryService>(TYPES.CategoryService).to(CategoryService);
container.bind<IProfileService>(TYPES.ProfileService).to(ProfileService);
container.bind<IShopService>(TYPES.ShopService).to(ShopService);
container.bind<IAuctionParticipantService>(TYPES.AuctionParticipantService).to(AuctionParticipantService);
container.bind<IAuthService>(TYPES.AuthService).to(AuthService);
container.bind<ITokenService>(TYPES.TokenService).to(TokenService);
container.bind<IBuyerAddressService>(TYPES.BuyerAddressService).to(BuyerAddressService);
container.bind<IBuyerReviewService>(TYPES.BuyerReviewService).to(BuyerReviewService);
container.bind<IBuyerFavoriteService>(TYPES.BuyerFavoriteService).to(BuyerFavoriteService);
container.bind<IBuyerOrderService>(TYPES.BuyerOrderService).to(BuyerOrderService);
container.bind<IBuyerPaymentService>(TYPES.BuyerPaymentService).to(BuyerPaymentService);

// V2 Media
container.bind(TYPES.S3Client).toConstantValue(createS3Client());
container.bind(TYPES.S3PresignService).to(S3PresignService);
container.bind(TYPES.MediaRepository).to(MediaRepository);
container.bind(TYPES.MediaService).to(MediaService);

container.bind<IBuyerReportService>(TYPES.BuyerReportService).to(BuyerReportService);
container.bind<ISizeUnitService>(TYPES.SizeUnitService).to(SizeUnitService);
container.bind<IInventoryService>(TYPES.InventoryService).to(InventoryService);
container.bind<IOTPService>(TYPES.OTPService).to(OTPService);
container.bind<IBuyerShopService>(TYPES.BuyerShopService).to(BuyerShopService);
container.bind<UserNotificationService>(TYPES.UserNotificationService).to(UserNotificationService);
container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService);
container.bind<ISellerShopService>(TYPES.SellerShopService).to(SellerShopService);
container.bind<IBuyerCheckoutService>(TYPES.BuyerCheckoutService).to(BuyerCheckoutService);

// Bind Cart Service
container.bind<ICartService>(TYPES.CartService).to(CartService);

// Bind Satisfy Service and Repository
container.bind<ISatisfyRepository>(TYPES.SatisfyRepository).to(SatisfyRepository);
container.bind<ISatisfyService>(TYPES.SatisfyService).to(SatisfyService);

// Bind Chat Service
container.bind<IChatService>(TYPES.ChatService).to(ChatService);

// Bind Shipping Service
container.bind<IshippingService>(TYPES.ShippingService).to(ShippingService);

// Bind RFQ Service
container.bind<IRFQService>(TYPES.RFQService).to(RFQService);

// Bind SocketService
container.bind<SocketService>(TYPES.SocketService).to(SocketService).inSingletonScope();

// Bind Controllers
container.bind<CartController>(TYPES.CartController).to(CartController);
container.bind<AuctionParticipantController>(TYPES.AuctionParticipantController).to(AuctionParticipantController);
container.bind<ItemController>(TYPES.ItemController).to(ItemController);
container.bind<BrandController>(TYPES.BrandController).to(BrandController);
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<BidController>(TYPES.BidController).to(BidController);
container.bind<AuctionController>(TYPES.AuctionController).to(AuctionController);
container.bind<CategoryController>(TYPES.CategoryController).to(CategoryController);
container.bind<TagController>(TYPES.TagController).to(TagController);
container.bind<ProfileController>(TYPES.ProfileController).to(ProfileController);
container.bind<ShopController>(TYPES.ShopController).to(ShopController);
container.bind<SatisfyController>(TYPES.SatisfyController).to(SatisfyController);
container.bind<BuyerAddressController>(TYPES.BuyerAddressController).to(BuyerAddressController);
container.bind<BuyerReviewController>(TYPES.BuyerReviewController).to(BuyerReviewController);
container.bind<BuyerFavoriteController>(TYPES.BuyerFavoriteController).to(BuyerFavoriteController);
container.bind<BuyerOrderController>(TYPES.BuyerOrderController).to(BuyerOrderController);
container.bind<BuyerPaymentController>(TYPES.BuyerPaymentController).to(BuyerPaymentController);
container.bind<BuyerReportController>(TYPES.BuyerReportController).to(BuyerReportController);
container.bind<SizeUnitController>(TYPES.SizeUnitController).to(SizeUnitController);
container.bind<ItemControllerV2>(TYPES.ItemControllerV2).to(ItemControllerV2);
container.bind<MediaController>(TYPES.MediaController).to(MediaController);
container.bind<OTPController>(TYPES.OTPController).to(OTPController);
container.bind<BuyerShopController>(TYPES.BuyerShopController).to(BuyerShopController);
container.bind<UserNotificationController>(TYPES.UserNotificationController).to(UserNotificationController);
container.bind<NotificationController>(TYPES.NotificationController).to(NotificationController);
container.bind<SellerShopController>(TYPES.SellerShopController).to(SellerShopController);
container.bind<ChatController>(TYPES.ChatController).to(ChatController);
container.bind<ShippingController>(TYPES.ShippingController).to(ShippingController);
container.bind<BuyerCheckoutController>(TYPES.BuyerCheckoutController).to(BuyerCheckoutController);
container.bind<RFQController>(TYPES.RFQController).to(RFQController);
export { container };
