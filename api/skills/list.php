<?php
// api/skills/list.php — GET /api/skills  (master skill list with categories)

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db   = Database::getInstance();
$stmt = $db->query(
    'SELECT s.id, s.skill_name, sc.name AS category, sc.id AS category_id, s.description
     FROM skills s JOIN skill_categories sc ON sc.id = s.category_id
     ORDER BY sc.name, s.skill_name'
);
json_success($stmt->fetchAll());
