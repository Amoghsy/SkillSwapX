<?php
// api/swaps/reject.php — PUT /api/swaps/{id}/reject

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
if (!$swap) json_error('Swap request not found or not yours to reject', 404);

$db->beginTransaction();
try {
    $db->prepare('UPDATE swap_requests SET status = "rejected" WHERE id = ?')->execute([$swapId]);

    // Refund locked credits to sender
    $amount = (int)$swap['credits_locked'];
    if ($amount > 0) {
        $db->prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
           ->execute([$amount, $swap['sender_id']]);

        $newBal = (int)$db->query("SELECT credits FROM users WHERE id = {$swap['sender_id']}")->fetchColumn();
        $db->prepare(
            'INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, ?, "refund", ?, ?)'
        )->execute([$swap['sender_id'], $amount, "swap:{$swapId}", $newBal]);

        $db->prepare('UPDATE credit_escrow SET status = "refunded", resolved_at = NOW() WHERE swap_request_id = ?')
           ->execute([$swapId]);
    }

    // Notify sender
    $db->prepare(
        'INSERT INTO notifications (user_id, type, title, body, reference) VALUES (?, "swap_rejected", "Swap Request Rejected", ?, ?)'
    )->execute([$swap['sender_id'], "Your swap request was declined. Your credits have been refunded.", "swap:{$swapId}"]);

    $db->commit();
    json_success(null, 200, 'Swap rejected and credits refunded');
} catch (Exception $e) {
    $db->rollBack();
    json_error('Failed: ' . $e->getMessage(), 500);
}
