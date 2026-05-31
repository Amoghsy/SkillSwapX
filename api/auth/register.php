<?php
// api/auth/register.php — POST /api/auth/register

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';

$body = get_json_body();
$rules = [
    'name'     => 'required|min:2|max:100',
    'username' => 'required|min:3|max:50',
    'email'    => 'required|email',
];

$isOAuth = !empty($body['oauth_provider']);
if (!$isOAuth || isset($body['password'])) {
    $rules['password'] = 'required|min:8|max:100';
}

validate($body, $rules);

$db = Database::getInstance();

// Check duplicate email
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([strtolower($body['email'])]);
if ($stmt->fetch()) {
    json_error('Email already registered', 409);
}

// Check duplicate username
$stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([strtolower(trim($body['username']))]);
if ($stmt->fetch()) {
    json_error('Username already taken', 409);
}

if ($isOAuth && !isset($body['password'])) {
    $hash = password_hash(bin2hex(random_bytes(16)), PASSWORD_BCRYPT, ['cost' => 12]);
} else {
    $hash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
}

$stmt = $db->prepare(
    'INSERT INTO users (name, username, email, password_hash, location, oauth_provider, oauth_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    trim($body['name']),
    strtolower(trim($body['username'])),
    strtolower(trim($body['email'])),
    $hash,
    $body['location'] ?? null,
    $body['oauth_provider'] ?? null,
    $body['oauth_id'] ?? null,
    $body['avatar_url'] ?? null,
]);
$userId = (int)$db->lastInsertId();

// Welcome credits transaction
$db->prepare(
    'INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, 10, "welcome", "welcome_bonus", 10)'
)->execute([$userId]);

// Issue tokens
$accessToken  = JWT::encode(['sub' => $userId, 'role' => 'user', 'tv' => 0]);
$refreshToken = JWT::generateRefreshToken();
$refreshHash  = hash('sha256', $refreshToken);
$expiresAt    = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

$db->prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
)->execute([$userId, $refreshHash, $expiresAt]);

json_success([
    'access_token'  => $accessToken,
    'refresh_token' => $refreshToken,
    'user' => [
        'id'      => $userId,
        'name'    => trim($body['name']),
        'username'=> strtolower(trim($body['username'])),
        'email'   => strtolower($body['email']),
        'credits' => 10,
        'trust_score' => 50.00,
        'trust_tier'  => 'Bronze',
    ],
], 201, 'Account created');
