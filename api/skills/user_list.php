<?php
// api/skills/user_list.php — GET /api/skills/user

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$db      = Database::getInstance();
$type    = $_GET['type'] ?? '';   // teach | learn | (blank = both)

$where  = ['us.user_id = ?', 'us.is_active = 1'];
$params = [$payload['sub']];
if (in_array($type, ['teach', 'learn'], true)) {
    $where[]  = 'us.type = ?';
    $params[] = $type;
}

$stmt = $db->prepare(
    'SELECT us.id, s.id AS skill_id, s.skill_name, sc.name AS category,
            us.type, us.proficiency, us.credit_rate, us.session_format, us.description
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     JOIN skill_categories sc ON sc.id = s.category_id
     WHERE ' . implode(' AND ', $where) . '
     ORDER BY us.type, s.skill_name'
);
$stmt->execute($params);
json_success($stmt->fetchAll());
