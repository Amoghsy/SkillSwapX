<?php
// api/sessions/complete.php — PUT /api/sessions/{id}/complete
// Marks session completed, releases escrow credits, updates trust scores

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload   = requireAuth();
$sessionId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$sessionId) json_error('Invalid session ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT s.*, sr.sender_id, sr.credits_locked, ce.id AS escrow_id, ce.status AS escrow_status
     FROM sessions s
     JOIN swap_requests sr ON sr.id = s.swap_request_id
     JOIN credit_escrow ce ON ce.swap_request_id = sr.id
     WHERE s.id = ? AND (s.mentor_id = ? OR s.learner_id = ?) AND s.attendance = "scheduled"'
);
$stmt->execute([$sessionId, $payload['sub'], $payload['sub']]);
$session = $stmt->fetch();
if (!$session) json_error('Session not found or already resolved', 404);

$db->beginTransaction();
try {
    // Mark session completed
    $db->prepare('UPDATE sessions SET attendance = "completed" WHERE id = ?')->execute([$sessionId]);
    $db->prepare('UPDATE swap_requests SET status = "completed" WHERE id = ?')->execute([$session['swap_request_id']]);

    // Release escrow → mentor
    $amount  = (int)$session['credits_locked'];
    $mentorId = $session['mentor_id'];

    $db->prepare('UPDATE credit_escrow SET status = "released", resolved_at = NOW() WHERE id = ?')
       ->execute([$session['escrow_id']]);
    $db->prepare('UPDATE users SET credits = credits + ? WHERE id = ?')->execute([$amount, $mentorId]);

    $newBal = (int)$db->query("SELECT credits FROM users WHERE id = {$mentorId}")->fetchColumn();
    $db->prepare(
        'INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, ?, "release", ?, ?)'
    )->execute([$mentorId, $amount, "session:{$sessionId}", $newBal]);

    // Trust score +5 for mentor (session completed)
    updateTrustScore($db, $mentorId, 5.0, 'session_completed', "session:{$sessionId}");
    // Trust score +3 for learner
    updateTrustScore($db, $session['learner_id'], 3.0, 'session_completed', "session:{$sessionId}");

    // Notify both parties
    foreach ([$mentorId, $session['learner_id']] as $uid) {
        $db->prepare(
            'INSERT INTO notifications (user_id, type, title, body, reference) VALUES (?, "session_completed", "Session Completed!", ?, ?)'
        )->execute([$uid, "Your session has been marked as completed. Leave feedback!", "session:{$sessionId}"]);
    }

    $db->commit();
    json_success(['credits_released' => $amount], 200, 'Session completed and credits released');
} catch (Exception $e) {
    $db->rollBack();
    json_error('Failed: ' . $e->getMessage(), 500);
}

// ── Trust score helper ────────────────────────────────────────
function updateTrustScore(PDO $db, int $userId, float $delta, string $event, string $ref): void
{
    $current = (float)$db->query("SELECT trust_score FROM users WHERE id = {$userId}")->fetchColumn();
    $newScore = max(0, min(100, $current + $delta));
    $tier = match(true) {
        $newScore >= 86 => 'Mentor Elite',
        $newScore >= 66 => 'Gold',
        $newScore >= 41 => 'Silver',
        default         => 'Bronze',
    };
    $db->prepare('UPDATE users SET trust_score = ?, trust_tier = ? WHERE id = ?')
       ->execute([$newScore, $tier, $userId]);
    $db->prepare(
        'INSERT INTO trust_events (user_id, event_type, delta, new_score, reference) VALUES (?, ?, ?, ?, ?)'
    )->execute([$userId, $event, $delta, $newScore, $ref]);
}
