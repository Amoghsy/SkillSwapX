<?php
// api/skills/user_delete.php — DELETE /api/skills/user/{id}

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$listingId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$listingId) json_error('Invalid listing ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'UPDATE user_skills SET is_active = 0 WHERE id = ? AND user_id = ?'
);
$stmt->execute([$listingId, $payload['sub']]);

if ($stmt->rowCount() === 0) json_error('Skill listing not found', 404);
json_success(null, 200, 'Skill removed');
