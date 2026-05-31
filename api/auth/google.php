<?php
// POST /api/auth/google

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_session.php';
require_once __DIR__ . '/../../helpers/social_auth.php';

$body       = get_json_body();
$credential = trim((string)($body['credential'] ?? ''));
if ($credential === '') json_error('Google credential token is required', 400);

try {
    $profile = verifyGoogleCredential($credential);
} catch (RuntimeException $e) {
    json_error($e->getMessage(), 401);
}

$googleId = (string)($profile['sub'] ?? '');
$email    = strtolower(trim((string)($profile['email'] ?? '')));
$name     = trim((string)($profile['name'] ?? 'Google user'));
$avatar   = isset($profile['picture']) ? (string)$profile['picture'] : null;
if ($googleId === '' || $email === '') json_error('Google account profile is incomplete', 422);

$db = Database::getInstance();
$stmt = $db->prepare('SELECT * FROM users WHERE oauth_provider = "google" AND oauth_id = ?');
$stmt->execute([$googleId]);
$user = $stmt->fetch();

if ($user) {
    if (!$user['is_active']) json_error('Account suspended', 403);
    json_success(['exists' => true] + issueUserSession($db, $user), 200, 'Successfully logged in with Google');
}

$googleIsAuthoritative = str_ends_with($email, '@gmail.com') || !empty($profile['hd']);
if (!$googleIsAuthoritative) {
    json_error('Use a Gmail or Google Workspace account for passwordless Google signup.', 422);
}

$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_error('An account with this email already exists. Sign in with its original method before linking Google.', 409);
}

json_success(socialOnboardingResponse('google', $googleId, $email, $name, $avatar), 200, 'Google verified. Complete your account details.');
