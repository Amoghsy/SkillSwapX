<?php
// api/circles/get.php — GET /api/circles/{id}

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$circleId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$circleId) json_error('Invalid circle ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT sc.*, u.name AS creator_name, u.avatar_url AS creator_avatar,
            COUNT(cm.user_id) AS member_count
     FROM skill_circles sc
     JOIN users u ON u.id = sc.created_by
     LEFT JOIN circle_members cm ON cm.circle_id = sc.id
     WHERE sc.id = ? AND sc.is_active = 1
     GROUP BY sc.id'
);
$stmt->execute([$circleId]);
$circle = $stmt->fetch();
if (!$circle) json_error('Circle not found', 404);

// Members list
$members = $db->prepare(
    'SELECT u.id, u.name, u.avatar_url, u.trust_tier, cm.role, cm.joined_at
     FROM circle_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.circle_id = ?
     ORDER BY cm.joined_at ASC'
);
$members->execute([$circleId]);
$circle['members'] = $members->fetchAll();

json_success($circle);
