<?php
// api/roadmap/generate.php - GET /api/roadmap/generate

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$db      = Database::getInstance();
$userId  = (int)$payload['sub'];

$goal = isset($_GET['goal']) ? trim($_GET['goal']) : '';
$recentSkills = [];

if (empty($goal)) {
    // A sender receives the requested skill; a receiver receives the offered skill.
    $stmt = $db->prepare(
        'SELECT CASE
                    WHEN sr.sender_id = ? THEN req_skill.skill_name
                    WHEN sr.receiver_id = ? THEN off_skill.skill_name
                END AS learned_skill
         FROM swap_requests sr
         JOIN skills req_skill ON req_skill.id = sr.skill_requested_id
         LEFT JOIN skills off_skill ON off_skill.id = sr.skill_offered_id
         WHERE (sr.sender_id = ? OR sr.receiver_id = ?)
           AND sr.status IN ("accepted", "completed")
         ORDER BY sr.created_at DESC
         LIMIT 5'
    );
    $stmt->execute([$userId, $userId, $userId, $userId]);

    foreach ($stmt->fetchAll() as $swap) {
        $skill = trim((string)($swap['learned_skill'] ?? ''));
        if ($skill !== '' && !in_array($skill, $recentSkills, true)) {
            $recentSkills[] = $skill;
        }
    }

    // Fallback: Check what the user has listed they want to learn
    if (empty($recentSkills)) {
        $stmt = $db->prepare(
            'SELECT s.skill_name FROM user_skills us
             JOIN skills s ON s.id = us.skill_id
             WHERE us.user_id = ? AND us.type = "learn" AND us.is_active = 1'
        );
        $stmt->execute([$userId]);
        foreach ($stmt->fetchAll() as $row) {
            $skill = trim((string)$row['skill_name']);
            if ($skill !== '' && !in_array($skill, $recentSkills, true)) {
                $recentSkills[] = $skill;
            }
        }
    }

    if (empty($recentSkills)) {
        json_error('Add a skill you want to learn in your profile, complete a swap, or enter a custom goal above to generate a roadmap.', 422);
    }

    $goal = implode(', ', $recentSkills);
} else {
    $recentSkills = [$goal];
}

$aiUrl = ($_ENV['AI_SERVICE_URL'] ?? 'http://localhost:8000') . '/roadmap';

$context = stream_context_create([
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode(['goal' => $goal, 'user_id' => $userId]),
        'timeout' => 15,
    ],
]);

$response = @file_get_contents($aiUrl, false, $context);

if ($response === false) {
    json_success([
        'goal'                  => $goal,
        'source_skills'         => $recentSkills,
        'based_on_recent_swaps' => true,
        'milestones' => [
            [
                'step' => 1,
                'skill' => 'Fundamentals of ' . $goal,
                'description' => 'Learn core building blocks, syntax, and tooling for ' . $goal . '.',
                'credits_needed' => 5,
                'estimated_weeks' => 2,
                'recommended_mentors' => []
            ],
            [
                'step' => 2,
                'skill' => 'Intermediate ' . $goal,
                'description' => 'Deep dive into patterns, state management, and real-world architectures for ' . $goal . '.',
                'credits_needed' => 10,
                'estimated_weeks' => 4,
                'recommended_mentors' => []
            ],
            [
                'step' => 3,
                'skill' => 'Advanced ' . $goal,
                'description' => 'Master performance tuning, scalability, design tokens, and production deployment of ' . $goal . '.',
                'credits_needed' => 15,
                'estimated_weeks' => 6,
                'recommended_mentors' => []
            ],
        ],
        'total_credits_needed' => 30,
        'estimated_weeks'      => 12,
        'note'                 => 'AI service offline - generated local template roadmap',
    ]);
}

$data = json_decode($response, true);
if (!$data) json_error('AI service returned invalid response', 502);

$data['source_skills'] = $recentSkills;
$data['based_on_recent_swaps'] = true;
json_success($data);

