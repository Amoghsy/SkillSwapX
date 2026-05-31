<?php
// api/users/notification_read.php — PUT /api/notifications/{id}/read

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$notifId = (int)($GLOBALS['urlParams'][0] ?? 0);

$db = Database::getInstance();

// id=0 means mark ALL as read
if ($notifId === 0) {
    $db->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
       ->execute([$payload['sub']]);
    json_success(null, 200, 'All notifications marked as read');
}

$stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
$stmt->execute([$notifId, $payload['sub']]);
if ($stmt->rowCount() === 0) json_error('Notification not found', 404);

json_success(null, 200, 'Marked as read');
