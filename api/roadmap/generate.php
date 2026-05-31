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
$source = isset($_GET['source']) ? trim($_GET['source']) : 'recent_swaps';
$recentSkills = [];

if (!in_array($source, ['recent_swaps', 'my_skills'], true)) {
    json_error('Invalid roadmap source', 400);
}

if (empty($goal)) {
    if ($source === 'recent_swaps') {
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
             ORDER BY sr.updated_at DESC
             LIMIT 5'
        );
        $stmt->execute([$userId, $userId, $userId, $userId]);

        foreach ($stmt->fetchAll() as $swap) {
            addUniqueSkill($recentSkills, $swap['learned_skill'] ?? '');
        }
    } else {
        $stmt = $db->prepare(
            'SELECT s.skill_name FROM user_skills us
             JOIN skills s ON s.id = us.skill_id
             WHERE us.user_id = ? AND us.is_active = 1
             ORDER BY CASE WHEN us.type = "learn" THEN 0 ELSE 1 END, us.created_at DESC
             LIMIT 5'
        );
        $stmt->execute([$userId]);
        foreach ($stmt->fetchAll() as $row) {
            addUniqueSkill($recentSkills, $row['skill_name'] ?? '');
        }
    }

    if (empty($recentSkills)) {
        $message = $source === 'recent_swaps'
            ? 'No accepted or completed swaps found yet. Refresh from My Skills or enter a custom goal above.'
            : 'Add a skill to your profile or enter a custom goal above to generate a roadmap.';
        json_error($message, 422);
    }

    $goal = implode(', ', $recentSkills);
} else {
    $source = 'custom_goal';
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
    $growthProjection = buildGrowthProjection($db, $userId, 30, 12);
    json_success([
        'goal'                  => $goal,
        'source_skills'         => $recentSkills,
        'source'                => $source,
        'based_on_recent_swaps' => $source === 'recent_swaps',
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
        'growth_projection'    => $growthProjection,
        'note'                 => 'AI service offline - generated local template roadmap',
    ]);
}

$data = json_decode($response, true);
if (!$data) json_error('AI service returned invalid response', 502);

$data['source_skills'] = $recentSkills;
$data['source'] = $source;
$data['based_on_recent_swaps'] = $source === 'recent_swaps';
$data['growth_projection'] = buildGrowthProjection(
    $db,
    $userId,
    (int)($data['total_credits_needed'] ?? 30),
    (int)($data['estimated_total_weeks'] ?? 12)
);
json_success($data);

function addUniqueSkill(array &$skills, mixed $value): void
{
    $skill = trim((string)$value);
    if ($skill !== '' && !in_array($skill, $skills, true)) {
        $skills[] = $skill;
    }
}

function buildGrowthProjection(PDO $db, int $userId, int $totalCredits, int $estimatedWeeks): array
{
    $stmt = $db->prepare(
        'SELECT
            (SELECT COUNT(*) FROM user_skills WHERE user_id = ? AND type = "learn" AND is_active = 1) AS learning_skills,
            (SELECT COUNT(*) FROM sessions WHERE learner_id = ? AND attendance = "completed") AS completed_sessions,
            (SELECT COUNT(*) FROM swap_requests
             WHERE (sender_id = ? OR receiver_id = ?) AND status IN ("accepted", "completed")) AS active_swaps'
    );
    $stmt->execute([$userId, $userId, $userId, $userId]);
    $activity = $stmt->fetch() ?: [];

    $baseline = min(
        70,
        20
        + ((int)($activity['learning_skills'] ?? 0) * 3)
        + ((int)($activity['completed_sessions'] ?? 0) * 5)
        + ((int)($activity['active_swaps'] ?? 0) * 2)
    );
    $monthlyGain = max(2.5, min(7.5, ($totalCredits / max(1, $estimatedWeeks)) * 1.6));
    $projection = [];

    for ($month = 1; $month <= 12; $month++) {
        $projection[] = [
            'month' => "M{$month}",
            'skill' => min(100, (int)round($baseline + ($monthlyGain * $month))),
        ];
    }

    return $projection;
}
