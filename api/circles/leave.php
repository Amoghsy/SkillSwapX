<?php
// api/circles/leave.php — DELETE /api/circles/{id}/leave

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload  = requireAuth();
$circleId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$circleId) json_error('Invalid circle ID', 400);

$db = Database::getInstance();

// Prevent creator from leaving (they must delete the circle instead)
$circle = $db->prepare('SELECT created_by FROM skill_circles WHERE id = ?');
$circle->execute([$circleId]);
$c = $circle->fetch();
if (!$c) json_error('Circle not found', 404);
if ((int)$c['created_by'] === $payload['sub']) json_error('Circle creator cannot leave. Delete the circle instead.', 400);

$stmt = $db->prepare('DELETE FROM circle_members WHERE circle_id = ? AND user_id = ?');
$stmt->execute([$circleId, $payload['sub']]);
if ($stmt->rowCount() === 0) json_error('You are not a member of this circle', 404);

json_success(null, 200, 'Left circle');
