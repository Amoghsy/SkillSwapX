<?php
// api/auth/github.php — POST /api/auth/github
// Simulates / executes GitHub profile mapping for onboarding.

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';

$body = get_json_body();
$code = $body['code'] ?? null;
$mockProfile = $body['profile'] ?? null;

if (!$code && !$mockProfile) {
    json_error('GitHub auth code or profile details are required', 400);
}

$email    = '';
$name     = '';
$githubId = '';
$avatar   = null;

if ($mockProfile) {
    // Direct profile parsing (e.g. from frontend dev helper)
    $email    = strtolower(trim($mockProfile['email'] ?? ''));
    $name     = trim($mockProfile['name'] ?? 'GitHub User');
    $githubId = (string)($mockProfile['id'] ?? '');
    $avatar   = $mockProfile['avatar_url'] ?? null;
} else {
    // In dev mode, simulate exchanging the code for a profile
    $githubId = 'gh_' . substr(md5((string)$code), 0, 10);
    $email    = 'github_' . substr(md5((string)$code), 0, 6) . '@example.com';
    $name     = 'GitHub Scholar';
    $avatar   = 'https://api.dicebear.com/9.x/glass/svg?seed=' . $name;
}

if (!$email || !$githubId) {
    json_error('GitHub credentials payload is incomplete', 400);
}

$db = Database::getInstance();

// Check if user already exists
$stmt = $db->prepare('SELECT * FROM users WHERE (oauth_provider = "github" AND oauth_id = ?) OR email = ?');
$stmt->execute([$githubId, $email]);
$user = $stmt->fetch();

if ($user) {
    // Link GitHub ID if not set
    if (!$user['oauth_provider']) {
        $db->prepare('UPDATE users SET oauth_provider = "github", oauth_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
           ->execute([$githubId, $avatar, $user['id']]);
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
    ], 200, 'Successfully logged in with GitHub');
} else {
    // User does not exist — return details for registration onboarding completion
    json_success([
        'exists'     => false,
        'email'      => $email,
        'name'       => $name,
        'avatar_url' => $avatar,
        'oauth_id'   => $githubId,
        'provider'   => 'github'
    ], 200, 'GitHub login parsed. Complete registration onboarding.');
}
