<?php
// api/credits/buy.php — POST /api/credits/buy

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$body    = get_json_body();

validate($body, [
    'credits' => 'required|int',
]);

$amount = (int)$body['credits'];
if ($amount <= 0 || $amount > 10000) {
    json_error('Invalid credits amount. Must be between 1 and 10000.', 400);
}

// Optional: in a real system you'd verify payment_intent_id / Stripe session here.
// For now, treat this as a direct admin-credited purchase.
$packageLabel = match(true) {
    $amount <= 5  => 'Bronze Pack',
    $amount <= 10 => 'Silver Pack',
    $amount <= 20 => 'Gold Pack',
    default       => 'Custom Pack',
};

$db = Database::getInstance();
$userId = $payload['sub'];

$db->beginTransaction();
try {
    // Credit the user
    $db->prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
       ->execute([$amount, $userId]);

    // Get new balance
    $newBalance = (int)$db->prepare('SELECT credits FROM users WHERE id = ?')
                           ->execute([$userId]) && $db->query("SELECT credits FROM users WHERE id = {$userId}")
                           ->fetchColumn();
    $newBalance = (int)$db->query("SELECT credits FROM users WHERE id = {$userId}")->fetchColumn();

    // Log transaction
    $db->prepare(
        'INSERT INTO credit_transactions (user_id, amount, type, reference, balance) VALUES (?, ?, "earn", ?, ?)'
    )->execute([$userId, $amount, "purchase:{$packageLabel}", $newBalance]);

    $db->commit();
    json_success([
        'credits_added' => $amount,
        'new_balance'   => $newBalance,
        'package'       => $packageLabel,
    ], 200, "Successfully purchased {$amount} credits ({$packageLabel})");

} catch (Exception $e) {
    $db->rollBack();
    json_error('Purchase failed: ' . $e->getMessage(), 500);
}
