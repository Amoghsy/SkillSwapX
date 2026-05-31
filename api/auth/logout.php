<?php
// api/auth/logout.php — POST /api/auth/logout

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$body    = get_json_body();

if (!empty($body['refresh_token'])) {
    $hash = hash('sha256', $body['refresh_token']);
    $db   = Database::getInstance();
    $db->prepare('DELETE FROM refresh_tokens WHERE token_hash = ? AND user_id = ?')
       ->execute([$hash, $payload['sub']]);
}

json_success(null, 200, 'Logged out');
