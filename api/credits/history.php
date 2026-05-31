<?php
// api/credits/history.php — GET /api/credits/history

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$db      = Database::getInstance();
$page    = max(1, (int)($_GET['page'] ?? 1));
$limit   = 20;
$offset  = ($page - 1) * $limit;

$stmt = $db->prepare(
    'SELECT id, amount, type, reference, balance, created_at
     FROM credit_transactions WHERE user_id = ?
     ORDER BY created_at DESC LIMIT ? OFFSET ?'
);
$stmt->execute([$payload['sub'], $limit, $offset]);

$total = (int)$db->prepare('SELECT COUNT(*) FROM credit_transactions WHERE user_id = ?')
                 ->execute([$payload['sub']]) && $db->query("SELECT FOUND_ROWS()")->fetchColumn();

json_success([
    'transactions' => $stmt->fetchAll(),
    'page'         => $page,
]);
