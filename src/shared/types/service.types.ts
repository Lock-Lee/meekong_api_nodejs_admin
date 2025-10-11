/**
 * Service Identifiers for Inversify DI Container
 * These symbols are used to identify services in the container
 */

// Repository Layer
export const TYPES = {
    // Repositories
    ItemRepository: Symbol.for('ItemRepository'),
    TagRepository: Symbol.for('TagRepository'),
    FileRepository: Symbol.for('FileRepository'),
    AuctionRepository: Symbol.for('AuctionRepository'),
    UserRepository: Symbol.for('UserRepository'),
    RefreshSessionRepository: Symbol.for('RefreshSessionRepository'),
    BidRepository: Symbol.for('BidRepository'),
    BrandRepository: Symbol.for('BrandRepository'),
    CartRepository: Symbol.for('CartRepository'),
    CategoryRepository: Symbol.for('CategoryRepository'),
    ProfileRepository: Symbol.for('ProfileRepository'),
    ShopRepository: Symbol.for('ShopRepository'),
    SatisfyRepository: Symbol.for('SatisfyRepository'),
    AuctionParticipantRepository: Symbol.for('AuctionParticipantRepository'),
    BuyerAddressRepository: Symbol.for('BuyerAddressRepository'),
    BuyerReviewRepository: Symbol.for('BuyerReviewRepository'),
    BuyerFavoriteRepository: Symbol.for('BuyerFavoriteRepository'),
    BuyerOrderRepository: Symbol.for('BuyerOrderRepository'),
    BuyerPaymentRepository: Symbol.for('BuyerPaymentRepository'),
    BuyerReportRepository: Symbol.for('BuyerReportRepository'),
    BuyerShopRepository: Symbol.for('BuyerShopRepository'),
    UserNotificationRepository: Symbol.for('UserNotificationRepository'),
    NotificationRepository: Symbol.for('NotificationRepository'),
    SellerShopRepository: Symbol.for('SellerShopRepository'),
    BuyerCheckoutRepository: Symbol.for('BuyerCheckoutRepository'),

    SizeUnitRepository: Symbol.for('SizeUnitRepository'),

    InventoryRepository: Symbol.for('InventoryRepository'),
    OTPRepository: Symbol.for('OTPRepository'),
    ChatRepository: Symbol.for('ChatRepository'),
    ShippingRepository: Symbol.for('ShippingRepository'),
    RFQRepository: Symbol.for('RFQRepository'),

    // Business Services
    ItemService: Symbol.for('ItemService'),
    AuctionService: Symbol.for('AuctionService'),
    TagService: Symbol.for('TagService'),
    FileService: Symbol.for('FileService'),
    AuthService: Symbol.for('AuthService'),
    TokenService: Symbol.for('TokenService'),
    BidService: Symbol.for('BidService'),
    BrandService: Symbol.for('BrandService'),
    CartService: Symbol.for('CartService'),
    CategoryService: Symbol.for('CategoryService'),
    ProfileService: Symbol.for('ProfileService'),
    ShopService: Symbol.for('ShopService'),
    SatisfyService: Symbol.for('SatisfyService'),
    AuctionParticipantService: Symbol.for('AuctionParticipantService'),
    BuyerAddressService: Symbol.for('BuyerAddressService'),
    BuyerReviewService: Symbol.for('BuyerReviewService'),
    BuyerFavoriteService: Symbol.for('BuyerFavoriteService'),
    BuyerOrderService: Symbol.for('BuyerOrderService'),
    BuyerPaymentService: Symbol.for('BuyerPaymentService'),
    BuyerReportService: Symbol.for('BuyerReportService'),
    BuyerShopService: Symbol.for('BuyerShopService'),
    UserNotificationService: Symbol.for('UserNotificationService'),
    NotificationService: Symbol.for('NotificationService'),
    SellerShopService: Symbol.for('SellerShopService'),
    BuyerCheckoutService: Symbol.for('BuyerCheckoutService'),

    SizeUnitService: Symbol.for('SizeUnitService'),

    InventoryService: Symbol.for('InventoryService'),

    // Media Services (v2)
    MediaService: Symbol.for('MediaService'),
    MediaRepository: Symbol.for('MediaRepository'),
    S3Client: Symbol.for('S3Client'),
    S3PresignService: Symbol.for('S3PresignService'),
    OTPService: Symbol.for('OTPService'),
    ChatService: Symbol.for('ChatService'),
    SocketService: Symbol.for('SocketService'),
    ShippingService: Symbol.for('ShippingService'),
    RFQService: Symbol.for('RFQService'),

    // External Services
    EmailService: Symbol.for('EmailService'),
    PaymentService: Symbol.for('PaymentService'),
    StorageService: Symbol.for('StorageService'),

    // Database
    DatabaseConnection: Symbol.for('DatabaseConnection'),
    PrismaClient: Symbol.for('PrismaClient'),

    OmiseClient: Symbol.for('OmiseClient'),

    // Logger
    Logger: Symbol.for('Logger'),

    // Controllers
    CartController: Symbol.for('CartController'),
    ItemController: Symbol.for('ItemController'),
    AuctionParticipantController: Symbol.for('AuctionParticipantController'),
    BrandController: Symbol.for('BrandController'),
    AuthController: Symbol.for('AuthController'),
    BidController: Symbol.for('BidController'),
    CategoryController: Symbol.for('CategoryController'),
    TagController: Symbol.for('TagController'),
    ProfileController: Symbol.for('ProfileController'),
    ShopController: Symbol.for('ShopController'),
    SatisfyController: Symbol.for('SatisfyController'),
    AuctionController: Symbol.for('AuctionController'),
    BuyerAddressController: Symbol.for('BuyerAddressController'),
    BuyerReviewController: Symbol.for('BuyerReviewController'),
    BuyerFavoriteController: Symbol.for('BuyerFavoriteController'),
    BuyerOrderController: Symbol.for('BuyerOrderController'),
    BuyerPaymentController: Symbol.for('BuyerPaymentController'),
    BuyerReportController: Symbol.for('BuyerReportController'),
    SizeUnitController: Symbol.for('SizeUnitController'),
    // V2 Controllers
    ItemControllerV2: Symbol.for('ItemControllerV2'),
    MediaController: Symbol.for('MediaController'),
    OTPController: Symbol.for('OTPController'),
    BuyerShopController: Symbol.for('BuyerShopController'),
    UserNotificationController: Symbol.for('UserNotificationController'),
    NotificationController: Symbol.for('NotificationController'),
    SellerShopController: Symbol.for('SellerShopController'),
    ChatController: Symbol.for('ChatController'),
    ShippingController: Symbol.for('ShippingController'),
    BuyerCheckoutController: Symbol.for('BuyerCheckoutController'),
    RFQController: Symbol.for('RFQController'),
} as const;
