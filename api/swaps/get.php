<?php
// api/swaps/get.php — GET /api/swaps/{id}

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$swapId  = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$swapId) json_error('Invalid swap ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT sr.*, 
            s_user.name AS sender_name, s_user.avatar_url AS sender_avatar, s_user.trust_tier AS sender_tier,
            r_user.name AS receiver_name, r_user.avatar_url AS receiver_avatar, r_user.trust_tier AS receiver_tier,
            req_skill.skill_name AS skill_requested, off_skill.skill_name AS skill_offered,
            sess.id AS session_id, sess.start_time, sess.duration_minutes, sess.attendance
     FROM swap_requests sr
     JOIN users s_user ON s_user.id = sr.sender_id
     JOIN users r_user ON r_user.id = sr.receiver_id
     JOIN skills req_skill ON req_skill.id = sr.skill_requested_id
     LEFT JOIN skills off_skill ON off_skill.id = sr.skill_offered_id
     LEFT JOIN sessions sess ON sess.swap_request_id = sr.id
     WHERE sr.id = ? AND (sr.sender_id = ? OR sr.receiver_id = ?)'
);
$stmt->execute([$swapId, $payload['sub'], $payload['sub']]);
$swap = $stmt->fetch();
if (!$swap) json_error('Swap not found', 404);

json_success($swap);
