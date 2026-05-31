<?php
// api/roadmap/generate.php — GET /api/roadmap/generate?goal=

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$goal    = trim($_GET['goal'] ?? '');
if (!$goal) json_error('goal query parameter is required', 400);

$aiUrl = ($_ENV['AI_SERVICE_URL'] ?? 'http://localhost:8000') . '/roadmap';

// Call Python FastAPI microservice
$context  = stream_context_create([
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode(['goal' => $goal, 'user_id' => $payload['sub']]),
        'timeout' => 10,
    ],
]);

$response = @file_get_contents($aiUrl, false, $context);

if ($response === false) {
    // Return a stub roadmap if AI service is unreachable (dev mode)
    json_success([
        'goal'      => $goal,
        'milestones' => [
            ['step' => 1, 'skill' => 'Fundamentals of ' . $goal, 'credits_needed' => 5,  'recommended_mentors' => []],
            ['step' => 2, 'skill' => 'Intermediate ' . $goal,    'credits_needed' => 10, 'recommended_mentors' => []],
            ['step' => 3, 'skill' => 'Advanced ' . $goal,        'credits_needed' => 15, 'recommended_mentors' => []],
        ],
        'total_credits_needed' => 30,
        'estimated_weeks'      => 12,
        'note' => 'AI service unavailable — showing placeholder roadmap',
    ]);
}

$data = json_decode($response, true);
if (!$data) json_error('AI service returned invalid response', 502);

json_success($data);
