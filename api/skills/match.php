<?php
// api/skills/match.php — GET /api/skills/match?skill_id=
// Proxies to Python AI microservice /match endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload  = requireAuth();
$skillId  = (int)($_GET['skill_id'] ?? 0);
$limit    = (int)($_GET['limit']    ?? 10);
if (!$skillId) json_error('skill_id is required', 400);

$aiUrl = ($_ENV['AI_SERVICE_URL'] ?? 'http://localhost:8000') . '/match';

$context = stream_context_create([
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode([
            'user_id'  => $payload['sub'],
            'skill_id' => $skillId,
            'limit'    => $limit,
        ]),
        'timeout' => 8,
    ],
]);

$response = @file_get_contents($aiUrl, false, $context);
if ($response === false) {
    // Fallback: plain DB query if AI service is down
    $db   = Database::getInstance();
    $stmt = $db->prepare(
        'SELECT u.id AS user_id, u.name AS user_name, u.avatar_url, u.trust_score, u.trust_tier,
                u.location, us.credit_rate
         FROM user_skills us
         JOIN users u ON u.id = us.user_id
         WHERE us.skill_id = ? AND us.type = "teach" AND us.is_active = 1 AND u.is_active = 1
           AND u.id != ?
         ORDER BY u.trust_score DESC LIMIT ?'
    );
    $stmt->execute([$skillId, $payload['sub'], $limit]);
    json_success(['candidates' => $stmt->fetchAll(), 'fallback' => true]);
}

$data = json_decode($response, true);
if (!$data) json_error('AI service returned invalid response', 502);
json_success($data);
