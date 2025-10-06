# Meekong API - E-commerce Platform API

A robust, scalable e-commerce API built with Node.js, TypeScript, and Clean Architecture principles. This API supports multiple transaction types including normal sales, auctions, RFQ (Request for Quotation), and satisfy (negotiation) transactions.

> Note: v2 media (JSON items + direct-to-S3 uploads) is documented in `docs/v2-media.md`. Legacy v1 endpoints remain unchanged.

## 🏗️ Architecture Overview

This project follows **Clean Architecture** principles with clear separation of concerns across three main layers:

### Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Web/Mobile Client]
        Swagger[Swagger UI]
    end

    subgraph "API Layer"
        Routes[Routes<br/>- item.routes.ts<br/>- auth.routes.ts<br/>- auction.routes.ts]
        Controllers[Controllers<br/>- ItemController<br/>- AuthController<br/>- AuctionController]
        Middleware[Middleware<br/>- AuthMiddleware<br/>- ValidationMiddleware<br/>- ErrorMiddleware]
    end

    subgraph "Business Layer"
        Services[Services<br/>- ItemService<br/>- TagService<br/>- FileService<br/>- AuthService]
        Interfaces[Business Interfaces<br/>- IItemService<br/>- ITagService<br/>- IFileService]
    end

    subgraph "Data Layer"
        Repositories[Repositories<br/>- ItemRepository<br/>- TagRepository<br/>- FileRepository]
        Database[(PostgreSQL<br/>Database)]
        Prisma[Prisma ORM]
    end

    subgraph "Cross-Cutting Concerns"
        DI[Dependency Injection<br/>Inversify Container]
        Logger[Winston Logger]
        Config[Configuration<br/>- App Config<br/>- Auth Config]
    end

    Client --> Routes
    Swagger --> Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Interfaces
    Services --> Repositories
    Repositories --> Prisma
    Prisma --> Database

    DI -.-> Controllers
    DI -.-> Services
    DI -.-> Repositories
    Logger -.-> Services
    Logger -.-> Controllers
    Config -.-> Services
```

### Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant R as Routes
    participant M as Middleware
    participant Ctrl as Controller
    participant S as Service
    participant Repo as Repository
    participant DB as Database

    C->>R: HTTP Request
    R->>M: Apply Middleware
    M->>M: Authentication Check
    M->>M: Request Validation
    M->>Ctrl: Forward Request
    Ctrl->>S: Business Logic Call
    S->>S: Apply Business Rules
    S->>Repo: Data Operation
    Repo->>DB: SQL Query
    DB-->>Repo: Result
    Repo-->>S: Mapped Data
    S-->>Ctrl: Business Result
    Ctrl-->>R: HTTP Response
    R-->>C: JSON Response
```

## 🛠️ Technology Stack

### Core Technologies
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **Dependency Injection**: Inversify
- **API Documentation**: Swagger/OpenAPI
- **File Upload**: express-fileupload

### Development Tools
- **Process Manager**: Nodemon
- **Build Tool**: TypeScript Compiler + tsc-alias
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest (configured)
- **Database Seeding**: Custom seed scripts

## 📁 Project Structure

```
meekong_api_nodejs/
├── docs/                           # Documentation
├── generated/                      # Generated Prisma client
├── prisma/                         # Database schema & migrations
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Database migrations
│   ├── seed.ts                    # Database seeding
│   └── base.seed.ts               # Base data seeding
├── public/                         # Static files
│   └── images/                    # Uploaded images
├── src/
│   ├── api/                       # API Layer (Controllers, Routes, Middleware)
│   │   ├── controllers/           # HTTP request handlers
│   │   ├── middlewares/           # Request/response middleware
│   │   ├── routes/                # Route definitions
│   │   └── schemas/               # Request validation schemas
│   ├── business/                  # Business Layer (Services, Rules)
│   │   ├── interfaces/            # Business contracts
│   │   ├── models/                # Business models
│   │   ├── rules/                 # Business rules
│   │   └── services/              # Business logic
│   ├── data/                      # Data Layer (Repositories, Database)
│   │   ├── database/              # Database connection
│   │   ├── external/              # External API clients
│   │   └── repositories/          # Data access layer
│   ├── main/                      # Application entry point
│   │   ├── app.ts                 # Express app configuration
│   │   ├── server.ts              # Server startup
│   │   └── inversify.config.ts    # Dependency injection setup
│   └── shared/                    # Shared utilities & configuration
│       ├── config/                # Application configuration
│       ├── errors/                # Custom error classes
│       ├── types/                 # TypeScript type definitions
│       └── utils/                 # Utility functions
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## 🏪 Core Business Features

### E-commerce Modules
1. **Items Management**: Create, update, search items with variants, tags, and images
2. **User Management**: Registration, authentication, profiles, roles
3. **Categories & Brands**: Hierarchical categorization system
4. **Shopping Cart**: Add, remove, manage cart items
5. **File Management**: Image upload and processing

### Transaction Types
1. **Normal Sales**: Standard buy-now transactions
2. **Auctions**: Time-based bidding system with real-time updates
3. **RFQ (Request for Quotation)**: B2B quotation requests and responses
4. **Satisfy**: Negotiation-based transactions with offer/counter-offer

### Advanced Features
1. **Tag System**: Flexible tagging with usage analytics
2. **Search & Filtering**: Advanced item search with multiple criteria
3. **Image Management**: Multi-image support with ordering
4. **Shipping Integration**: Courier services integration (Shippop)
5. **Payment Processing**: Omise payment gateway integration
6. **Return System**: Comprehensive return/refund management

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dev19demo/meekong_api_nodejs.git
   cd meekong_api_nodejs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/meekong_db"
   
   # Authentication
   AUTH_SECRET="your-jwt-secret-key"
   AUTH_SECRET_EXPIRES_IN="2h"
   AUTH_REFRESH_SECRET="your-refresh-secret-key"
   AUTH_REFRESH_SECRET_EXPIRES_IN="7d"
   
   # Server
   APP_PORT=3000
   NODE_ENV=development
   
   # External Services (optional)
   OMISE_PUBLIC_KEY="your-omise-public-key"
   OMISE_SECRET_KEY="your-omise-secret-key"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database (optional)
   npm run db:seed:base
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Swagger Documentation
Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **API JSON**: `http://localhost:3000/api-docs.json`

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

#### Items
- `GET /api/item/getAll` - Get all items (paginated)
- `GET /api/item/search` - Search items with filters
- `POST /api/item/create` - Create new item (authenticated)
- `PUT /api/item/update/:id` - Update item (authenticated)
- `GET /api/item/:id` - Get item details

#### Categories
- `GET /api/category/getAll` - Get all categories
- `GET /api/category/:id` - Get category details
- `POST /api/category/create` - Create category (admin)

#### Brands
- `GET /api/brand/getAll` - Get all brands
- `POST /api/brand/create` - Create brand (admin)

#### FireBase Notification

To send a notification using Firebase Cloud Messaging (FCM), you can use the following example code:

```typescript
    import { getFirebaseMessaging } from "infra/firebase/firebase.client";
      const messaging = getFirebaseMessaging();

      
    const FCM = ["device_token_1", "device_token_2"]; 
        await fcm.sendToDevice(FCM, {
            notification: {
                title: "สวัสดีครับ 👋",
                body: "มีรายการชำระเงินใหม่เข้ามาแล้ว",
            },
            data: {
                orderId: "1234",
            },
        });
        console.log("Notification sent successfully");
   


```

This example demonstrates how to send a notification with a title, body, and additional data (e.g., `orderId`) to multiple device tokens.


## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run db:seed:base # Seed database with base data
```

### Database Operations

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 🏛️ Architecture Principles

### Clean Architecture Benefits
1. **Separation of Concerns**: Each layer has distinct responsibilities
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Testability**: Easy to unit test business logic in isolation
4. **Maintainability**: Changes in one layer don't affect others
5. **Scalability**: Easy to add new features without breaking existing code

### Design Patterns Used
1. **Repository Pattern**: Data access abstraction
2. **Service Layer**: Business logic encapsulation
3. **Dependency Injection**: Loose coupling between components
4. **Factory Pattern**: Object creation abstraction
5. **Observer Pattern**: Event-driven architecture (notifications)

### Code Quality Standards
1. **TypeScript**: Strong typing throughout the application
2. **Interface Segregation**: Small, focused interfaces
3. **Error Handling**: Comprehensive error handling with custom error types
4. **Logging**: Structured logging with Winston
5. **Validation**: Input validation with Zod schemas

## 🔐 Security Features

1. **Authentication**: JWT-based authentication with refresh tokens
2. **Authorization**: Role-based access control
3. **Input Validation**: Request validation with Zod
4. **CORS**: Configurable cross-origin resource sharing
5. **Error Handling**: Secure error responses
6. **Rate Limiting**: API rate limiting (configurable)

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection string
- JWT secrets
- External service credentials
- Server configuration

### Production Considerations
1. **Database**: Use connection pooling for PostgreSQL
2. **Logging**: Configure appropriate log levels
3. **Monitoring**: Set up application monitoring
4. **Security**: Enable HTTPS and security headers
5. **Performance**: Consider Redis for caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines
- Follow TypeScript best practices
- Use meaningful variable and function names
- Write comprehensive JSDoc comments
- Maintain test coverage
- Follow the established architecture patterns

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the architecture documentation in `/docs`

---

**Built with ❤️ by the Meekong Development Team**
