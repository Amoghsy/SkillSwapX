<?php
// api/skills/search.php — GET /api/skills/search?q=&category=&trust_tier=&page=

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db       = Database::getInstance();
$q        = trim($_GET['q'] ?? '');
$category = $_GET['category'] ?? '';
$tier     = $_GET['trust_tier'] ?? '';
$page     = max(1, (int)($_GET['page'] ?? 1));
$limit    = 12;
$offset   = ($page - 1) * $limit;

$where  = ['us.is_active = 1', 'us.type = "teach"', 'u.is_active = 1'];
$params = [];

if ($q !== '') {
    $where[]  = '(s.skill_name LIKE ? OR s.description LIKE ?)';
    $params[] = "%{$q}%";
    $params[] = "%{$q}%";
}
if ($category !== '') {
    $where[]  = 'sc.name = ?';
    $params[] = $category;
}
if ($tier !== '') {
    $where[]  = 'u.trust_tier = ?';
    $params[] = $tier;
}

$whereSQL = implode(' AND ', $where);

$countStmt = $db->prepare(
    "SELECT COUNT(*) FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     JOIN skill_categories sc ON sc.id = s.category_id
     JOIN users u ON u.id = us.user_id
     WHERE {$whereSQL}"
);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$stmt = $db->prepare(
    "SELECT us.id AS listing_id, s.id AS skill_id, s.skill_name, sc.name AS category,
            us.proficiency, us.credit_rate, us.session_format, us.description,
            u.id AS user_id, u.name AS user_name, u.avatar_url,
            u.trust_score, u.trust_tier, u.location
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     JOIN skill_categories sc ON sc.id = s.category_id
     JOIN users u ON u.id = us.user_id
     WHERE {$whereSQL}
     ORDER BY u.trust_score DESC, us.credit_rate ASC
     LIMIT {$limit} OFFSET {$offset}"
);
$stmt->execute($params);

json_success([
    'results'      => $stmt->fetchAll(),
    'total'        => $total,
    'page'         => $page,
    'total_pages'  => (int)ceil($total / $limit),
]);
