<?php
// api/users/notifications.php — GET /api/notifications

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$db      = Database::getInstance();
$unread  = $_GET['unread'] ?? '';

$where  = 'user_id = ?';
$params = [$payload['sub']];
if ($unread === 'true') { $where .= ' AND is_read = 0'; }

$stmt = $db->prepare(
    "SELECT id, type, title, body, is_read, reference, created_at
     FROM notifications WHERE {$where}
     ORDER BY created_at DESC LIMIT 30"
);
$stmt->execute($params);

$unreadCount = (int)$db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0')
                        ->execute([$payload['sub']]) ? $db->query("SELECT ROW_COUNT()")->fetchColumn() : 0;

// Simpler unread count
$ucStmt = $db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$ucStmt->execute([$payload['sub']]);
$unreadCount = (int)$ucStmt->fetchColumn();

json_success([
    'notifications' => $stmt->fetchAll(),
    'unread_count'  => $unreadCount,
]);
