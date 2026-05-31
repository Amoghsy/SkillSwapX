<?php
// api/swaps/create.php — POST /api/swaps/request

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$body    = get_json_body();

// Only receiver_id and skill_requested_id are required.
// skill_offered_id is optional (barter mode) — null means video pitch or direct booking.
validate($body, [
    'receiver_id'        => 'required|int',
    'skill_requested_id' => 'required|int',
]);

$senderId   = $payload['sub'];
$receiverId = (int)$body['receiver_id'];

if ($senderId === $receiverId) json_error('Cannot send a swap request to yourself', 400);

$db = Database::getInstance();

// Check receiver exists
$recv = $db->prepare('SELECT id FROM users WHERE id = ? AND is_active = 1');
$recv->execute([$receiverId]);
if (!$recv->fetch()) json_error('Receiver not found', 404);

// Check for existing pending request between these two users for the same skill
$dup = $db->prepare(
    'SELECT id FROM swap_requests
     WHERE sender_id = ? AND receiver_id = ? AND skill_requested_id = ? AND status = "pending"'
);
$dup->execute([$senderId, $receiverId, (int)$body['skill_requested_id']]);
if ($dup->fetch()) json_error('You already have a pending request for this skill with this user. Wait for them to respond or cancel the existing request first.', 409);

// ── Determine mode and credit cost ─────────────────────────────
// Mode A: Barter       — skill_offered_id provided  → free (0 credits)
// Mode B: Video Pitch  — video_url provided           → free (0 credits)
// Mode C: Direct       — neither provided             → pay credit_rate

$skillOfferedId = isset($body['skill_offered_id']) ? (int)$body['skill_offered_id'] : null;
$videoUrl       = isset($body['video_url']) ? trim($body['video_url']) : null;

$isFree = ($skillOfferedId !== null) || (!empty($videoUrl));

if ($isFree) {
    $credits = 0;
} else {
    // Determine credit cost from receiver's listing for the requested skill
    $listing = $db->prepare(
        'SELECT credit_rate FROM user_skills
         WHERE user_id = ? AND skill_id = ? AND type = "teach" AND is_active = 1'
    );
    $listing->execute([$receiverId, (int)$body['skill_requested_id']]);
    $row     = $listing->fetch();
    $credits = $row ? (int)$row['credit_rate'] : 5;

    // Check sender has enough credits
    $balance = $db->prepare('SELECT credits FROM users WHERE id = ?');
    $balance->execute([$senderId]);
    $senderCredits = (int)$balance->fetchColumn();
    if ($senderCredits < $credits) {
        json_error("Insufficient credits. You have {$senderCredits}, need {$credits}.", 402);
    }
}

// ── Atomic: create swap (+ optional deduct) + escrow ───────────
$db->beginTransaction();
try {
    if ($credits > 0) {
        // Deduct from sender
        $db->prepare('UPDATE users SET credits = credits - ? WHERE id = ?')
           ->execute([$credits, $senderId]);
    }

    // Create swap
    $db->prepare(
        'INSERT INTO swap_requests
         (sender_id, receiver_id, skill_requested_id, skill_offered_id, credits_locked, message, video_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $senderId,
        $receiverId,
        (int)$body['skill_requested_id'],
        $skillOfferedId,
        $credits,
        $body['message'] ?? null,
        $videoUrl ?: null,
    ]);
    $swapId = (int)$db->lastInsertId();

    // Always create escrow record (amount may be 0)
    $db->prepare('INSERT INTO credit_escrow (swap_request_id, amount) VALUES (?, ?)')
       ->execute([$swapId, $credits]);

    // Transaction log — only log if credits were actually locked
    if ($credits > 0) {
        $senderCredits ??= (int)$db->query("SELECT credits FROM users WHERE id = {$senderId}")->fetchColumn();
        $newBalance = $senderCredits - $credits;
        $db->prepare(
            'INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, ?, "lock", ?, ?)'
        )->execute([$senderId, -$credits, "swap:{$swapId}", $newBalance]);
    }

    // Notify receiver
    $modeLabel = $skillOfferedId ? 'barter' : ($videoUrl ? 'video pitch' : 'direct booking');
    $db->prepare(
        'INSERT INTO notifications (user_id, type, title, body, reference) VALUES (?, "swap_request", "New Swap Request", ?, ?)'
    )->execute([$receiverId, "You have a new skill swap request ({$modeLabel})!", "swap:{$swapId}"]);

    $db->commit();
    json_success([
        'swap_id'        => $swapId,
        'credits_locked' => $credits,
        'mode'           => $modeLabel,
    ], 201, 'Swap request created');
} catch (Exception $e) {
    $db->rollBack();
    json_error('Transaction failed: ' . $e->getMessage(), 500);
}
