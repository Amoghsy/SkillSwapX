<?php
// api/circles/list.php — GET /api/circles?topic=&page=

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db     = Database::getInstance();
$topic  = $_GET['topic'] ?? '';
$page   = max(1, (int)($_GET['page'] ?? 1));
$limit  = 12;
$offset = ($page - 1) * $limit;

$where  = ['sc.is_active = 1'];
$params = [];

if ($topic !== '') {
    $where[]  = 'sc.topic LIKE ?';
    $params[] = "%{$topic}%";
}

$whereSQL = implode(' AND ', $where);

$stmt = $db->prepare(
    "SELECT sc.id, sc.name, sc.topic, sc.description, sc.location,
            sc.weekly_schedule, sc.max_members, sc.created_at,
            u.name AS creator_name,
            COUNT(cm.user_id) AS member_count
     FROM skill_circles sc
     JOIN users u ON u.id = sc.created_by
     LEFT JOIN circle_members cm ON cm.circle_id = sc.id
     WHERE {$whereSQL}
     GROUP BY sc.id
     ORDER BY sc.created_at DESC
     LIMIT {$limit} OFFSET {$offset}"
);
$stmt->execute($params);
json_success($stmt->fetchAll());
