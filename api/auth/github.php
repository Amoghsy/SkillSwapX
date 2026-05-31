<?php
// POST /api/auth/github

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth_session.php';
require_once __DIR__ . '/../../helpers/social_auth.php';

$body         = get_json_body();
$code         = trim((string)($body['code'] ?? ''));
$redirectUri  = trim((string)($body['redirect_uri'] ?? ''));
$codeVerifier = trim((string)($body['code_verifier'] ?? ''));

if (GITHUB_CLIENT_ID === '' || GITHUB_CLIENT_SECRET === '') json_error('GitHub sign-in is not configured', 503);
if ($code === '' || $codeVerifier === '') json_error('GitHub authorization code and PKCE verifier are required', 400);
if ($redirectUri !== GITHUB_REDIRECT_URI) json_error('GitHub redirect URI is invalid', 400);

try {
    $token = httpJson('https://github.com/login/oauth/access_token', [
        'headers' => ['Accept: application/json', 'User-Agent: SkillSwap-X'],
        'body' => http_build_query([
            'client_id'     => GITHUB_CLIENT_ID,
            'client_secret' => GITHUB_CLIENT_SECRET,
            'code'          => $code,
            'redirect_uri'  => GITHUB_REDIRECT_URI,
            'code_verifier' => $codeVerifier,
        ]),
    ]);
    if (empty($token['access_token'])) {
        throw new RuntimeException((string)($token['error_description'] ?? 'GitHub did not issue an access token'));
    }

    $headers = [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token['access_token'],
        'User-Agent: SkillSwap-X',
        'X-GitHub-Api-Version: 2022-11-28',
    ];
    $profile = httpJson('https://api.github.com/user', ['headers' => $headers]);
    $emails  = httpJson('https://api.github.com/user/emails', ['headers' => $headers]);
} catch (RuntimeException $e) {
    json_error('GitHub authentication failed: ' . $e->getMessage(), 401);
}

$email = '';
foreach ($emails as $candidate) {
    if (($candidate['primary'] ?? false) && ($candidate['verified'] ?? false)) {
        $email = strtolower(trim((string)$candidate['email']));
        break;
    }
}
if ($email === '') {
    foreach ($emails as $candidate) {
        if ($candidate['verified'] ?? false) {
            $email = strtolower(trim((string)$candidate['email']));
            break;
        }
    }
}

$githubId = (string)($profile['id'] ?? '');
$name     = trim((string)($profile['name'] ?? $profile['login'] ?? 'GitHub user'));
$avatar   = isset($profile['avatar_url']) ? (string)$profile['avatar_url'] : null;
if ($githubId === '' || $email === '') json_error('GitHub account must have a verified email address', 422);

$db = Database::getInstance();
$stmt = $db->prepare('SELECT * FROM users WHERE oauth_provider = "github" AND oauth_id = ?');
$stmt->execute([$githubId]);
$user = $stmt->fetch();

if ($user) {
    if (!$user['is_active']) json_error('Account suspended', 403);
    json_success(['exists' => true] + issueUserSession($db, $user), 200, 'Successfully logged in with GitHub');
}

$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_error('An account with this email already exists. Sign in with its original method before linking GitHub.', 409);
}

json_success(socialOnboardingResponse('github', $githubId, $email, $name, $avatar), 200, 'GitHub verified. Complete your account details.');
