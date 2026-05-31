<?php
// api/sessions/list.php — GET /api/sessions?role=mentor|learner&status=

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$userId  = $payload['sub'];
$db      = Database::getInstance();

$role   = $_GET['role']   ?? '';
$status = $_GET['status'] ?? '';

$where  = ['(s.mentor_id = ? OR s.learner_id = ?)'];
$params = [$userId, $userId];

if ($role === 'mentor')  { $where = ['s.mentor_id = ?'];  $params = [$userId]; }
if ($role === 'learner') { $where = ['s.learner_id = ?']; $params = [$userId]; }
if ($status) { $where[] = 's.attendance = ?'; $params[] = $status; }

$whereSQL = implode(' AND ', $where);

$stmt = $db->prepare(
    "SELECT s.id, s.start_time, s.duration_minutes, s.attendance,
            s.feedback_score, s.recording_url,
            m.id AS mentor_id, m.name AS mentor_name, m.avatar_url AS mentor_avatar,
            l.id AS learner_id, l.name AS learner_name, l.avatar_url AS learner_avatar,
            req_skill.skill_name AS skill_taught
     FROM sessions s
     JOIN users m ON m.id = s.mentor_id
     JOIN users l ON l.id = s.learner_id
     JOIN swap_requests sr ON sr.id = s.swap_request_id
     JOIN skills req_skill ON req_skill.id = sr.skill_requested_id
     WHERE {$whereSQL}
     ORDER BY s.start_time DESC
     LIMIT 50"
);
$stmt->execute($params);
json_success($stmt->fetchAll());
