-- Seed script for Chat System (Satisfy conversations)
-- This script creates sample chat conversations and messages for testing the admin chat feature
-- with USER_ADMIN and SHOP_ADMIN conversation types

-- Prerequisites: Ensure you have at least one User, Shop, and Admin in the database
-- You can check with:
-- SELECT id, email FROM "User" LIMIT 5;
-- SELECT id, name FROM "Shop" LIMIT 5;

-- ==================================================
-- STEP 1: Create sample users if they don't exist
-- ==================================================

-- Create a regular user (if not exists)
INSERT INTO "User" (id, email, "createdAt", "updatedAt")
VALUES ('user-001', 'buyer@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "UserProfile" (id, "userId", "firstName", "lastName", "createdAt", "updatedAt")
VALUES ('profile-user-001', 'user-001', 'John', 'Buyer', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a shop owner
INSERT INTO "User" (id, email, "createdAt", "updatedAt")
VALUES ('user-002', 'seller@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "UserProfile" (id, "userId", "firstName", "lastName", "createdAt", "updatedAt")
VALUES ('profile-user-002', 'user-002', 'Jane', 'Seller', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a shop
INSERT INTO "Shop" (id, name, description, slug, "sellerId", "createdAt", "updatedAt")
VALUES ('shop-001', 'Best Shop', 'The best shop in town', 'best-shop', 'user-002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create an admin user
INSERT INTO "User" (id, email, "createdAt", "updatedAt")
VALUES ('admin-001', 'admin@example.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "UserProfile" (id, "userId", "firstName", "lastName", "createdAt", "updatedAt")
VALUES ('profile-admin-001', 'admin-001', 'Admin', 'Support', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- STEP 2: Create Chat Conversations
-- ==================================================

-- 1. USER_ADMIN conversation (User คุยกับ Admin)
INSERT INTO "ChatConversation" (id, type, "userId", "adminUserId", title, status, "lastMessage", "lastMessageAt", "createdAt", "updatedAt")
VALUES (
    'conv-user-admin-001',
    'USER_ADMIN',
    'user-001',
    'admin-001',
    'Help with my order',
    'ACTIVE',
    'Thank you for your help!',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 2. SHOP_ADMIN conversation (Shop คุยกับ Admin)
INSERT INTO "ChatConversation" (id, type, "shopId", "adminUserId", title, status, "lastMessage", "lastMessageAt", "createdAt", "updatedAt")
VALUES (
    'conv-shop-admin-001',
    'SHOP_ADMIN',
    'shop-001',
    'admin-001',
    'Questions about commission',
    'ACTIVE',
    'I understand now, thanks!',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 3. USER_SHOP conversation (User คุยกับ Shop)
INSERT INTO "ChatConversation" (id, type, "userId", "shopId", title, status, "lastMessage", "lastMessageAt", "createdAt", "updatedAt")
VALUES (
    'conv-user-shop-001',
    'USER_SHOP',
    'user-001',
    'shop-001',
    'Product inquiry',
    'ACTIVE',
    'Is this item still available?',
    NOW() - INTERVAL '15 minutes',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '15 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- STEP 3: Create Chat Messages
-- ==================================================

-- Messages for USER_ADMIN conversation
INSERT INTO "ChatMessage" (id, "conversationId", "senderId", "senderType", message, "messageType", "isRead", "createdAt", "updatedAt")
VALUES
    ('msg-001', 'conv-user-admin-001', 'user-001', 'USER', 'Hello, I need help with my order #12345', 'TEXT', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('msg-002', 'conv-user-admin-001', 'admin-001', 'ADMIN', 'Hello! I would be happy to help you. Could you please provide more details about your issue?', 'TEXT', true, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
    ('msg-003', 'conv-user-admin-001', 'user-001', 'USER', 'My order hasn''t arrived yet. It''s been 5 days.', 'TEXT', true, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
    ('msg-004', 'conv-user-admin-001', 'admin-001', 'ADMIN', 'Let me check the tracking information for you. Please give me a moment.', 'TEXT', true, NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes'),
    ('msg-005', 'conv-user-admin-001', 'admin-001', 'ADMIN', 'I can see that your package is currently with the courier. It should arrive within 1-2 business days.', 'TEXT', true, NOW() - INTERVAL '2 days' + INTERVAL '20 minutes', NOW() - INTERVAL '2 days' + INTERVAL '20 minutes'),
    ('msg-006', 'conv-user-admin-001', 'user-001', 'USER', 'Thank you for your help!', 'TEXT', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Messages for SHOP_ADMIN conversation
INSERT INTO "ChatMessage" (id, "conversationId", "senderId", "senderType", message, "messageType", "isRead", "createdAt", "updatedAt")
VALUES
    ('msg-101', 'conv-shop-admin-001', 'shop-001', 'SHOP', 'Hi, I have a question about the commission rate', 'TEXT', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('msg-102', 'conv-shop-admin-001', 'admin-001', 'ADMIN', 'Hello! What would you like to know about commission rates?', 'TEXT', true, NOW() - INTERVAL '1 day' + INTERVAL '3 minutes', NOW() - INTERVAL '1 day' + INTERVAL '3 minutes'),
    ('msg-103', 'conv-shop-admin-001', 'shop-001', 'SHOP', 'What is the commission for auction items?', 'TEXT', true, NOW() - INTERVAL '1 day' + INTERVAL '8 minutes', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes'),
    ('msg-104', 'conv-shop-admin-001', 'admin-001', 'ADMIN', 'The commission rate for auction items is typically 5% of the final sale price.', 'TEXT', true, NOW() - INTERVAL '1 day' + INTERVAL '12 minutes', NOW() - INTERVAL '1 day' + INTERVAL '12 minutes'),
    ('msg-105', 'conv-shop-admin-001', 'shop-001', 'SHOP', 'And what about normal sales?', 'TEXT', true, NOW() - INTERVAL '1 day' + INTERVAL '18 minutes', NOW() - INTERVAL '1 day' + INTERVAL '18 minutes'),
    ('msg-106', 'conv-shop-admin-001', 'admin-001', 'ADMIN', 'Normal sales have a 3% commission rate.', 'TEXT', true, NOW() - INTERVAL '1 day' + INTERVAL '22 minutes', NOW() - INTERVAL '1 day' + INTERVAL '22 minutes'),
    ('msg-107', 'conv-shop-admin-001', 'shop-001', 'SHOP', 'I understand now, thanks!', 'TEXT', true, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- Messages for USER_SHOP conversation
INSERT INTO "ChatMessage" (id, "conversationId", "senderId", "senderType", message, "messageType", "isRead", "createdAt", "updatedAt")
VALUES
    ('msg-201', 'conv-user-shop-001', 'user-001', 'USER', 'Hello! I''m interested in the vintage camera you posted.', 'TEXT', true, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
    ('msg-202', 'conv-user-shop-001', 'shop-001', 'SHOP', 'Hello! Thank you for your interest. Which camera are you looking at?', 'TEXT', true, NOW() - INTERVAL '2 hours' + INTERVAL '45 minutes', NOW() - INTERVAL '2 hours' + INTERVAL '45 minutes'),
    ('msg-203', 'conv-user-shop-001', 'user-001', 'USER', 'The Canon AE-1. What condition is it in?', 'TEXT', true, NOW() - INTERVAL '2 hours' + INTERVAL '30 minutes', NOW() - INTERVAL '2 hours' + INTERVAL '30 minutes'),
    ('msg-204', 'conv-user-shop-001', 'shop-001', 'SHOP', 'It''s in excellent condition. The shutter works perfectly and there are no scratches on the lens.', 'TEXT', true, NOW() - INTERVAL '2 hours' + INTERVAL '25 minutes', NOW() - INTERVAL '2 hours' + INTERVAL '25 minutes'),
    ('msg-205', 'conv-user-shop-001', 'user-001', 'USER', 'Is this item still available?', 'TEXT', false, NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- STEP 4: Verify the data
-- ==================================================

-- You can verify the data with these queries:

-- SELECT * FROM "ChatConversation" WHERE id LIKE 'conv-%';
-- SELECT * FROM "ChatMessage" WHERE "conversationId" LIKE 'conv-%';

-- To check USER_ADMIN conversations:
-- SELECT c.id, c.type, u1.email as user_email, u2.email as admin_email, c.title, c."lastMessage"
-- FROM "ChatConversation" c
-- LEFT JOIN "User" u1 ON c."userId" = u1.id
-- LEFT JOIN "User" u2 ON c."adminUserId" = u2.id
-- WHERE c.type = 'USER_ADMIN';

-- To check SHOP_ADMIN conversations:
-- SELECT c.id, c.type, s.name as shop_name, u.email as admin_email, c.title, c."lastMessage"
-- FROM "ChatConversation" c
-- LEFT JOIN "Shop" s ON c."shopId" = s.id
-- LEFT JOIN "User" u ON c."adminUserId" = u.id
-- WHERE c.type = 'SHOP_ADMIN';

-- To check USER_SHOP conversations:
-- SELECT c.id, c.type, u.email as user_email, s.name as shop_name, c.title, c."lastMessage"
-- FROM "ChatConversation" c
-- LEFT JOIN "User" u ON c."userId" = u.id
-- LEFT JOIN "Shop" s ON c."shopId" = s.id
-- WHERE c.type = 'USER_SHOP';
