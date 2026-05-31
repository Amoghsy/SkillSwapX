<?php
// api/swaps/cancel.php — PUT /api/swaps/{id}/cancel

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$swapId  = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$swapId) json_error('Invalid swap ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT * FROM swap_requests WHERE id = ? AND sender_id = ? AND status IN ("pending","accepted")'
);
$stmt->execute([$swapId, $payload['sub']]);
$swap = $stmt->fetch();
if (!$swap) json_error('Swap not found or cannot be cancelled', 404);

$db->beginTransaction();
try {
    $db->prepare('UPDATE swap_requests SET status = "cancelled" WHERE id = ?')->execute([$swapId]);

    // Refund escrow credits
    $amount = (int)$swap['credits_locked'];
    if ($amount > 0) {
        $db->prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
           ->execute([$amount, $payload['sub']]);

        $newBal = (int)$db->query("SELECT credits FROM users WHERE id = {$payload['sub']}")->fetchColumn();
        $db->prepare(
            'INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, ?, "refund", ?, ?)'
        )->execute([$payload['sub'], $amount, "swap:{$swapId}", $newBal]);

        $db->prepare('UPDATE credit_escrow SET status = "refunded", resolved_at = NOW() WHERE swap_request_id = ?')
           ->execute([$swapId]);
    }

    // Cancel associated session if any
    $db->prepare('UPDATE sessions SET attendance = "cancelled" WHERE swap_request_id = ?')->execute([$swapId]);

    // Trust penalty for late cancellation (within 24h of session)
    $session = $db->prepare(
        'SELECT start_time FROM sessions WHERE swap_request_id = ? LIMIT 1'
    );
    $session->execute([$swapId]);
    $sess = $session->fetch();
    if ($sess) {
        $hoursUntil = (strtotime($sess['start_time']) - time()) / 3600;
        if ($hoursUntil < 24 && $hoursUntil > 0) {
            // Late cancellation trust penalty
            require_once __DIR__ . '/../sessions/complete.php';
            updateTrustScore($db, $payload['sub'], -6.0, 'late_cancellation', "swap:{$swapId}");
        }
    }

    // Notify receiver
    $db->prepare(
        'INSERT INTO notifications (user_id, type, title, body, reference) VALUES (?, "swap_cancelled", "Swap Cancelled", ?, ?)'
    )->execute([$swap['receiver_id'], "A swap request was cancelled.", "swap:{$swapId}"]);

    $db->commit();
    json_success(null, 200, 'Swap cancelled and credits refunded');
} catch (Exception $e) {
    $db->rollBack();
    json_error('Failed: ' . $e->getMessage(), 500);
}
