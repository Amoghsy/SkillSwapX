<?php
// api/sessions/feedback.php — POST /api/sessions/{id}/feedback

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload   = requireAuth();
$sessionId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$sessionId) json_error('Invalid session ID', 400);

$body = get_json_body();
validate($body, ['score' => 'required|int']);
$score = (int)$body['score'];
if ($score < 1 || $score > 5) json_error('Score must be between 1 and 5', 422);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT * FROM sessions WHERE id = ? AND learner_id = ? AND attendance = "completed"'
);
$stmt->execute([$sessionId, $payload['sub']]);
$session = $stmt->fetch();
if (!$session) json_error('Session not found, not yours, or not completed yet', 404);

$db->prepare('UPDATE sessions SET feedback_score = ?, feedback_text = ? WHERE id = ?')
   ->execute([$score, $body['text'] ?? null, $sessionId]);

// Adjust mentor trust score based on feedback
require_once __DIR__ . '/complete.php';
$delta = match(true) {
    $score >= 4 => 3.0,
    $score >= 3 => 0.0,
    default     => -4.0,
};
if ($delta !== 0.0) {
    updateTrustScore($db, $session['mentor_id'], $delta, 'feedback_received', "session:{$sessionId}");
}

json_success(null, 200, 'Feedback submitted');
