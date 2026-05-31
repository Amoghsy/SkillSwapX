<?php
// api/swaps/accept.php — PUT /api/swaps/{id}/accept

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$swapId  = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$swapId) json_error('Invalid swap ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT * FROM swap_requests WHERE id = ? AND receiver_id = ? AND status = "pending"'
);
$stmt->execute([$swapId, $payload['sub']]);
$swap = $stmt->fetch();
if (!$swap) json_error('Swap request not found or not yours to accept', 404);

$body       = get_json_body();
$startTime  = $body['start_time']        ?? date('Y-m-d H:i:s', strtotime('+3 days'));
$duration   = (int)($body['duration_minutes'] ?? 60);

$db->beginTransaction();
try {
    $db->prepare('UPDATE swap_requests SET status = "accepted" WHERE id = ?')->execute([$swapId]);

    // Create session
    $db->prepare(
        'INSERT INTO sessions (swap_request_id, mentor_id, learner_id, start_time, duration_minutes)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([$swapId, $payload['sub'], $swap['sender_id'], $startTime, $duration]);
    $sessionId = (int)$db->lastInsertId();

    // Notify sender
    $db->prepare(
        'INSERT INTO notifications (user_id, type, title, body, reference)
         VALUES (?, "swap_accepted", "Swap Request Accepted!", ?, ?)'
    )->execute([
        $swap['sender_id'],
        "Your swap request was accepted! Session scheduled for {$startTime}.",
        "session:{$sessionId}"
    ]);

    $db->commit();
    json_success(['session_id' => $sessionId], 200, 'Swap accepted and session scheduled');
} catch (Exception $e) {
    $db->rollBack();
    json_error('Failed to accept swap: ' . $e->getMessage(), 500);
}
