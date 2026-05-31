<?php
// api/auth/refresh.php — POST /api/auth/refresh

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';

$body = get_json_body();
if (empty($body['refresh_token'])) json_error('refresh_token required', 400);

$hash = hash('sha256', $body['refresh_token']);
$db   = Database::getInstance();

$stmt = $db->prepare(
    'SELECT rt.id, rt.user_id, rt.expires_at, u.role, u.token_version, u.is_active
     FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ?'
);
$stmt->execute([$hash]);
$row = $stmt->fetch();

if (!$row || strtotime($row['expires_at']) < time() || !$row['is_active']) {
    json_error('Invalid or expired refresh token', 401);
}

// Rotate: delete old, issue new
$db->prepare('DELETE FROM refresh_tokens WHERE id = ?')->execute([$row['id']]);

$newAccess  = JWT::encode(['sub' => $row['user_id'], 'role' => $row['role'], 'tv' => $row['token_version']]);
$newRefresh = JWT::generateRefreshToken();
$newHash    = hash('sha256', $newRefresh);
$expiresAt  = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

$db->prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
)->execute([$row['user_id'], $newHash, $expiresAt]);

json_success([
    'access_token'  => $newAccess,
    'refresh_token' => $newRefresh,
]);
