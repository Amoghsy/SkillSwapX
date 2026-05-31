<?php
// api/credits/balance.php — GET /api/credits/balance

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$db      = Database::getInstance();

$stmt = $db->prepare('SELECT credits FROM users WHERE id = ?');
$stmt->execute([$payload['sub']]);
$row = $stmt->fetch();

// Also get locked (in-escrow) credits
$escrow = $db->prepare(
    'SELECT COALESCE(SUM(ce.amount), 0) AS locked
     FROM credit_escrow ce
     JOIN swap_requests sr ON sr.id = ce.swap_request_id
     WHERE sr.sender_id = ? AND ce.status = "held"'
);
$escrow->execute([$payload['sub']]);
$locked = (int)$escrow->fetchColumn();

json_success([
    'available' => (int)$row['credits'],
    'locked'    => $locked,
    'total'     => (int)$row['credits'] + $locked,
]);
