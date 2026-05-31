<?php
// api/users/profile.php — GET /api/users/{id}/profile  (public)

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$userId = (int)($GLOBALS['urlParams'][0] ?? 0);
if (!$userId) json_error('Invalid user ID', 400);

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT id, name, username, bio, location, avatar_url, trust_score, trust_tier,
            verification_status, created_at
     FROM users WHERE id = ? AND is_active = 1'
);
$stmt->execute([$userId]);
$user = $stmt->fetch();
if (!$user) json_error('User not found', 404);

// Public skills (teach only)
$skills = $db->prepare(
    'SELECT us.id, s.skill_name, sc.name AS category, us.proficiency,
            us.credit_rate, us.session_format, us.description
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     JOIN skill_categories sc ON sc.id = s.category_id
     WHERE us.user_id = ? AND us.type = "teach" AND us.is_active = 1'
);
$skills->execute([$userId]);
$user['skills_offered'] = $skills->fetchAll();

// Session stats
$stats = $db->prepare(
    'SELECT COUNT(*) AS total_sessions,
            AVG(feedback_score) AS avg_rating
     FROM sessions WHERE mentor_id = ? AND attendance = "completed"'
);
$stats->execute([$userId]);
$user['stats'] = $stats->fetch();

json_success($user);
