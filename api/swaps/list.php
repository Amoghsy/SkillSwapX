<?php
// api/swaps/list.php — GET /api/swaps?status=&role=

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$userId  = $payload['sub'];
$db      = Database::getInstance();

$status = $_GET['status'] ?? '';   // pending|accepted|completed|rejected|cancelled
$role   = $_GET['role']   ?? '';   // sender|receiver

$where  = ['(sr.sender_id = ? OR sr.receiver_id = ?)'];
$params = [$userId, $userId];

if ($status) { $where[] = 'sr.status = ?'; $params[] = $status; }
if ($role === 'sender')   { $where = ['sr.sender_id = ?'];   $params = [$userId]; }
if ($role === 'receiver') { $where = ['sr.receiver_id = ?']; $params = [$userId]; }

$whereSQL = implode(' AND ', $where);

$stmt = $db->prepare(
    "SELECT sr.id, sr.status, sr.credits_locked, sr.message, sr.created_at,
            sr.sender_id, s_user.name AS sender_name, s_user.avatar_url AS sender_avatar,
            sr.receiver_id, r_user.name AS receiver_name, r_user.avatar_url AS receiver_avatar,
            req_skill.skill_name AS skill_requested, off_skill.skill_name AS skill_offered
     FROM swap_requests sr
     JOIN users s_user ON s_user.id = sr.sender_id
     JOIN users r_user ON r_user.id = sr.receiver_id
     JOIN skills req_skill ON req_skill.id = sr.skill_requested_id
     JOIN skills off_skill ON off_skill.id = sr.skill_offered_id
     WHERE {$whereSQL}
     ORDER BY sr.created_at DESC
     LIMIT 50"
);
$stmt->execute($params);
json_success($stmt->fetchAll());
