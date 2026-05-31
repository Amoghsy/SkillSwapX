<?php
// middleware/auth.php — JWT authentication middleware

declare(strict_types=1);

require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/database.php';

function getAuthorizationHeader(): string
{
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }
    if (function_exists('apache_request_headers')) {
        $headers = array_change_key_case(apache_request_headers(), CASE_LOWER);
        if (isset($headers['authorization'])) {
            return trim($headers['authorization']);
        }
    }
    return '';
}

function requireAuth(): array
{
    $auth = getAuthorizationHeader();
    if (!str_starts_with($auth, 'Bearer ')) {
        json_error('Unauthorized — no token provided', 401);
    }

    $token = substr($auth, 7);

    try {
        $payload = JWT::decode($token);
    } catch (RuntimeException $e) {
        json_error($e->getMessage(), 401);
    }

    // Check token version (invalidated on password change)
    $db   = Database::getInstance();
    $stmt = $db->prepare('SELECT id, role, token_version, is_active FROM users WHERE id = ?');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();

    if (!$user || !$user['is_active'])          json_error('Account not found or disabled', 401);
    if ($user['token_version'] !== $payload['tv']) json_error('Token has been invalidated', 401);

    return $payload;
}

function requireAdmin(): array
{
    $payload = requireAuth();
    if ($payload['role'] !== 'admin') json_error('Admin access required', 403);
    return $payload;
}
