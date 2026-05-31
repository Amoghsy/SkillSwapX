<?php
// api/auth/google.php — POST /api/auth/google
// Natively decodes Google JWT, checks existence, registers or initiates multi-step onboarding.

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';

$body = get_json_body();
$credential = $body['credential'] ?? null;

if (!$credential) {
    json_error('Google credential token is required', 400);
}

// 1. Decode Google ID Token (JWT) natively
$parts = explode('.', $credential);
if (count($parts) !== 3) {
    json_error('Invalid JWT format from Google', 400);
}

$payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
if (!$payload) {
    json_error('Failed to parse Google JWT payload', 400);
}

// Basic JWT validation (issuer and expiration)
if (!str_contains($payload['iss'] ?? '', 'accounts.google.com')) {
    json_error('Invalid token issuer', 400);
}
if (($payload['exp'] ?? 0) < time()) {
    json_error('Google token has expired', 401);
}

$email    = strtolower(trim($payload['email'] ?? ''));
$name     = trim($payload['name'] ?? '');
$googleId = $payload['sub'] ?? '';
$avatar   = $payload['picture'] ?? null;

if (!$email || !$googleId) {
    json_error('Google token payload is missing email or user ID', 400);
}

$db = Database::getInstance();

// 2. Check if user already exists (by google OAuth ID or email)
$stmt = $db->prepare('SELECT * FROM users WHERE (oauth_provider = "google" AND oauth_id = ?) OR email = ?');
$stmt->execute([$googleId, $email]);
$user = $stmt->fetch();

if ($user) {
    // Check if we need to link the Google ID
    if (!$user['oauth_provider']) {
        $db->prepare('UPDATE users SET oauth_provider = "google", oauth_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
           ->execute([$googleId, $avatar, $user['id']]);
    }

    // Direct login: Issue tokens
    $accessToken  = JWT::encode(['sub' => $user['id'], 'role' => $user['role'], 'tv' => $user['token_version']]);
    $refreshToken = JWT::generateRefreshToken();
    $refreshHash  = hash('sha256', $refreshToken);
    $expiresAt    = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

    // Keep last 5 refresh tokens
    $db->prepare(
        'DELETE FROM refresh_tokens WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (SELECT id FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 4) t
         )'
    )->execute([$user['id'], $user['id']]);

    $db->prepare(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    )->execute([$user['id'], $refreshHash, $expiresAt]);

    json_success([
        'exists'        => true,
        'access_token'  => $accessToken,
        'refresh_token' => $refreshToken,
        'user' => [
            'id'          => $user['id'],
            'name'        => $user['name'],
            'username'    => $user['username'] ?? strstr($email, '@', true),
            'email'       => $user['email'],
            'role'        => $user['role'],
            'credits'     => $user['credits'],
            'trust_score' => $user['trust_score'],
            'trust_tier'  => $user['trust_tier'],
        ]
    ], 200, 'Successfully logged in with Google');
} else {
    // User does not exist — return parsed details for onboarding / registration completion
    json_success([
        'exists'     => false,
        'email'      => $email,
        'name'       => $name,
        'avatar_url' => $avatar,
        'oauth_id'   => $googleId,
        'provider'   => 'google'
    ], 200, 'Google login parsed. Complete registration onboarding.');
}
