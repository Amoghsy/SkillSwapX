<?php
// api/users/me.php — GET /api/users/me  (own profile)

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$db      = Database::getInstance();

$stmt = $db->prepare(
    'SELECT id, name, username, email, bio, location, avatar_url, trust_score, trust_tier,
            credits, verification_status, role, created_at
     FROM users WHERE id = ?'
);
$stmt->execute([$payload['sub']]);
$user = $stmt->fetch();
if (!$user) json_error('User not found', 404);

// Attach user's teach/learn skills
$skills = $db->prepare(
    'SELECT us.id, s.skill_name, sc.name AS category, us.type, us.proficiency,
            us.credit_rate, us.session_format, us.description
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     JOIN skill_categories sc ON sc.id = s.category_id
     WHERE us.user_id = ? AND us.is_active = 1'
);
$skills->execute([$payload['sub']]);
$user['skills'] = $skills->fetchAll();

json_success($user);
