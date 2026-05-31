<?php
// api/circles/join.php — POST /api/circles/{id}/join

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload  = requireAuth();
$circleId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$circleId) json_error('Invalid circle ID', 400);

$db = Database::getInstance();

// Check circle exists and get member count
$circle = $db->prepare(
    'SELECT sc.id, sc.max_members, COUNT(cm.user_id) AS member_count
     FROM skill_circles sc
     LEFT JOIN circle_members cm ON cm.circle_id = sc.id
     WHERE sc.id = ? AND sc.is_active = 1
     GROUP BY sc.id'
);
$circle->execute([$circleId]);
$c = $circle->fetch();
if (!$c) json_error('Circle not found', 404);
if ((int)$c['member_count'] >= (int)$c['max_members']) json_error('Circle is full', 409);

try {
    $db->prepare('INSERT INTO circle_members (circle_id, user_id) VALUES (?, ?)')
       ->execute([$circleId, $payload['sub']]);
    json_success(null, 200, 'Joined circle');
} catch (PDOException $e) {
    json_error('Already a member of this circle', 409);
}
