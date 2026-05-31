<?php
// api/auth/login.php — POST /api/auth/login

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';

$body = get_json_body();

$username = $body['username'] ?? $body['email'] ?? null;
$password = $body['password'] ?? null;

if ($username === null || $username === '' || $password === null || $password === '') {
    $errors = [];
    if ($username === null || $username === '') $errors['username'] = 'username or email is required';
    if ($password === null || $password === '') $errors['password'] = 'password is required';
    json_error('Validation failed', 422, $errors);
}

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT id, name, username, email, password_hash, role, token_version, credits, trust_score, trust_tier, is_active
     FROM users WHERE email = ? OR username = ?'
);
$identifier = strtolower(trim((string)$username));
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($body['password'], $user['password_hash'])) {
    json_error('Invalid email or password', 401);
}

if (!$user['is_active']) {
    json_error('Account suspended', 403);
}

// Issue tokens
$accessToken  = JWT::encode(['sub' => $user['id'], 'role' => $user['role'], 'tv' => $user['token_version']]);
$refreshToken = JWT::generateRefreshToken();
$refreshHash  = hash('sha256', $refreshToken);
$expiresAt    = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

// Remove old refresh tokens for this user (keep last 5)
$db->prepare(
    'DELETE FROM refresh_tokens WHERE user_id = ? AND id NOT IN (
        SELECT id FROM (SELECT id FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 4) t
     )'
)->execute([$user['id'], $user['id']]);

$db->prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
)->execute([$user['id'], $refreshHash, $expiresAt]);

json_success([
    'access_token'  => $accessToken,
    'refresh_token' => $refreshToken,
    'user' => [
        'id'          => $user['id'],
        'name'        => $user['name'],
        'username'    => $user['username'],
        'email'       => $user['email'],
        'role'        => $user['role'],
        'credits'     => $user['credits'],
        'trust_score' => $user['trust_score'],
        'trust_tier'  => $user['trust_tier'],
    ],
]);
