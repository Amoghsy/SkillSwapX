<?php
// api/users/update.php — PUT /api/users/me

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$body    = get_json_body();
$db      = Database::getInstance();

$allowed = ['name', 'bio', 'location', 'avatar_url'];
$sets    = [];
$params  = [];

foreach ($allowed as $field) {
    if (isset($body[$field])) {
        $sets[]   = "{$field} = ?";
        $params[] = $body[$field];
    }
}

// Optional username change: check duplicates and validation
if (isset($body['username'])) {
    $username = strtolower(trim($body['username']));
    if (strlen($username) < 3 || strlen($username) > 50) {
        json_error('Username must be between 3 and 50 characters', 422);
    }
    $stmt = $db->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
    $stmt->execute([$username, $payload['sub']]);
    if ($stmt->fetch()) {
        json_error('Username already taken', 409);
    }
    $sets[]   = 'username = ?';
    $params[] = $username;
}

// Password change: bump token_version to invalidate existing JWTs
if (!empty($body['password'])) {
    if (strlen($body['password']) < 8) json_error('Password must be at least 8 characters', 422);
    $sets[]   = 'password_hash = ?';
    $params[] = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
    $sets[]   = 'token_version = token_version + 1';
}

if (empty($sets)) json_error('No fields to update', 400);

$params[] = $payload['sub'];
$db->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')
   ->execute($params);

json_success(null, 200, 'Profile updated');
