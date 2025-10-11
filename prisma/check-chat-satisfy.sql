-- Quick verification script for Chat System
-- This script checks if the chat system is working correctly

\echo '========================================='
\echo 'Chat System Verification'
\echo '========================================='

\echo ''
\echo '1. USER_ADMIN Conversations (Admin <-> User)'
\echo '-----------------------------------------'
SELECT
    c.id as conv_id,
    u1.email as user_email,
    CONCAT(up1."firstName", ' ', up1."lastName") as user_name,
    u2.email as admin_email,
    CONCAT(up2."firstName", ' ', up2."lastName") as admin_name,
    c.title,
    c."lastMessage",
    (SELECT COUNT(*) FROM "ChatMessage" WHERE "conversationId" = c.id) as msg_count
FROM "ChatConversation" c
LEFT JOIN "User" u1 ON c."userId" = u1.id
LEFT JOIN "UserProfile" up1 ON u1.id = up1."userId"
LEFT JOIN "User" u2 ON c."adminUserId" = u2.id
LEFT JOIN "UserProfile" up2 ON u2.id = up2."userId"
WHERE c.type = 'USER_ADMIN';

\echo ''
\echo '2. SHOP_ADMIN Conversations (Admin <-> Shop)'
\echo '-----------------------------------------'
SELECT
    c.id as conv_id,
    s.name as shop_name,
    u.email as admin_email,
    CONCAT(up."firstName", ' ', up."lastName") as admin_name,
    c.title,
    c."lastMessage",
    (SELECT COUNT(*) FROM "ChatMessage" WHERE "conversationId" = c.id) as msg_count
FROM "ChatConversation" c
LEFT JOIN "Shop" s ON c."shopId" = s.id
LEFT JOIN "User" u ON c."adminUserId" = u.id
LEFT JOIN "UserProfile" up ON u.id = up."userId"
WHERE c.type = 'SHOP_ADMIN';

\echo ''
\echo '3. USER_SHOP Conversations (User <-> Shop)'
\echo '-----------------------------------------'
SELECT
    c.id as conv_id,
    u.email as user_email,
    CONCAT(up."firstName", ' ', up."lastName") as user_name,
    s.name as shop_name,
    c.title,
    c."lastMessage",
    (SELECT COUNT(*) FROM "ChatMessage" WHERE "conversationId" = c.id) as msg_count
FROM "ChatConversation" c
LEFT JOIN "User" u ON c."userId" = u.id
LEFT JOIN "UserProfile" up ON u.id = up."userId"
LEFT JOIN "Shop" s ON c."shopId" = s.id
WHERE c.type = 'USER_SHOP';

\echo ''
\echo '4. Summary Statistics'
\echo '-----------------------------------------'
SELECT
    c.type,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m."isRead" = false) as unread_messages
FROM "ChatConversation" c
LEFT JOIN "ChatMessage" m ON c.id = m."conversationId"
WHERE c.id LIKE 'conv-%'
GROUP BY c.type
ORDER BY c.type;

\echo ''
\echo '5. Recent Messages (Last 5)'
\echo '-----------------------------------------'
SELECT
    m.id,
    m."conversationId",
    m."senderType",
    LEFT(m.message, 50) as message_preview,
    m."isRead",
    m."createdAt"
FROM "ChatMessage" m
WHERE m."conversationId" LIKE 'conv-%'
ORDER BY m."createdAt" DESC
LIMIT 5;

\echo ''
\echo '========================================='
\echo 'Verification Complete!'
\echo '========================================='
