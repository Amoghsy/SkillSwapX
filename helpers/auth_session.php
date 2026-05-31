<?php

declare(strict_types=1);

require_once __DIR__ . '/jwt.php';

function issueUserSession(PDO $db, array $user): array
{
    $accessToken  = JWT::encode([
        'sub'  => (int)$user['id'],
        'role' => $user['role'],
        'tv'   => (int)$user['token_version'],
    ]);
    $refreshToken = JWT::generateRefreshToken();
    $refreshHash  = hash('sha256', $refreshToken);
    $expiresAt    = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

    $db->prepare(
        'DELETE FROM refresh_tokens WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (SELECT id FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 4) t
         )'
    )->execute([$user['id'], $user['id']]);

    $db->prepare(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    )->execute([$user['id'], $refreshHash, $expiresAt]);

    return [
        'access_token'  => $accessToken,
        'refresh_token' => $refreshToken,
        'user' => [
            'id'          => (int)$user['id'],
            'name'        => $user['name'],
            'username'    => $user['username'],
            'email'       => $user['email'],
            'role'        => $user['role'],
            'credits'     => (int)$user['credits'],
            'trust_score' => (float)$user['trust_score'],
            'trust_tier'  => $user['trust_tier'],
        ],
    ];
}
