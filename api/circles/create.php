<?php
// api/circles/create.php — POST /api/circles

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$body    = get_json_body();

validate($body, [
    'name'  => 'required|min:3|max:150',
    'topic' => 'required|max:100',
]);

$db = Database::getInstance();
$db->prepare(
    'INSERT INTO skill_circles (name, description, location, latitude, longitude, topic, weekly_schedule, max_members, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $body['name'],
    $body['description'] ?? null,
    $body['location']    ?? null,
    $body['latitude']    ?? null,
    $body['longitude']   ?? null,
    $body['topic'],
    $body['weekly_schedule'] ?? null,
    (int)($body['max_members'] ?? 15),
    $payload['sub'],
]);
$circleId = (int)$db->lastInsertId();

// Auto-join creator as admin
$db->prepare(
    'INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, "admin")'
)->execute([$circleId, $payload['sub']]);

json_success(['circle_id' => $circleId], 201, 'Circle created');
