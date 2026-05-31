<?php
// api/skills/recommendations.php — GET /api/skills/recommendations
// Dynamic peer learning recommendation matching engine powered by Google Gemini API (with offline DB-backed fallback)

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$userId  = (int)$payload['sub'];
$db      = Database::getInstance();

// 1. Fetch current user profile
$stmt = $db->prepare('SELECT name, credits, location FROM users WHERE id = ?');
$stmt->execute([$userId]);
$currentUser = $stmt->fetch();
if (!$currentUser) json_error('User not found', 404);

// 2. Fetch current user's learning interests
$stmt = $db->prepare(
    'SELECT s.skill_name, s.id AS skill_id FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ? AND us.type = "learn" AND us.is_active = 1'
);
$stmt->execute([$userId]);
$learnSkills = $stmt->fetchAll();
$learnList   = array_column($learnSkills, 'skill_name');

// 3. Fetch current user's teaching skills
$stmt = $db->prepare(
    'SELECT s.skill_name, s.id AS skill_id FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ? AND us.type = "teach" AND us.is_active = 1'
);
$stmt->execute([$userId]);
$teachSkills = $stmt->fetchAll();
$teachList   = array_column($teachSkills, 'skill_name');

// 4. Fetch other active mentors & listings in the database
$stmt = $db->prepare(
    'SELECT u.id AS user_id, u.name AS user_name, u.location, u.trust_score, u.trust_tier,
            s.skill_name, s.id AS skill_id, us.proficiency, us.credit_rate
     FROM user_skills us
     JOIN users u ON u.id = us.user_id
     JOIN skills s ON s.id = us.skill_id
     WHERE us.type = "teach" AND us.is_active = 1 AND u.is_active = 1 AND u.id != ?
     ORDER BY u.trust_score DESC'
);
$stmt->execute([$userId]);
$availableMentors = $stmt->fetchAll();

// 5. Try calling Google Gemini API if key is present
$geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?? null;
$recommendations = [];

if ($geminiApiKey) {
    // Format prompt data for Gemini
    $prompt = "You are the AI Matchmaker Coach for SkillSwap X, a decentralized peer learning barter platform.
We have a user named {$currentUser['name']} (ID: {$userId}) located in {$currentUser['location']}.
They want to LEARN: " . implode(', ', $learnList) . "
They can TEACH: " . implode(', ', $teachList) . "
They currently have {$currentUser['credits']} credits.

Here is a list of other active mentors and what they teach:
";
    foreach ($availableMentors as $m) {
        $prompt .= "- {$m['user_name']} in {$m['location']} teaches '{$m['skill_name']}' ({$m['proficiency']}) at rate {$m['credit_rate']} credits/hr. (Trust score: {$m['trust_score']}, Tier: {$m['trust_tier']})\n";
    }

    $prompt .= "\nBased on this, suggest the top 3 best peer-learning suggestions.
Make sure the suggestions reference ACTUAL mentors and skills listed above.
Be highly specific. For example, if Aarav wants to learn Design and Maya teaches Design, match them!
Format your output STRICTLY as a raw JSON array of exactly 3 objects (no markdown wrappers like ```json), each having these exact keys:
- 'tag': A short badge (e.g. 'Top match', 'Stretch', 'Easy win')
- 'title': A title for the swap (e.g. 'Pair with Maya Lin on Design')
- 'reason': A short explanation of why (e.g. 'Maya teaches Design which you want to learn, and she is located near you!')
";

    $apiURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $geminiApiKey;
    $requestBody = json_encode([
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ]
    ]);

    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => $requestBody,
            'timeout' => 8,
        ]
    ]);

    $response = @file_get_contents($apiURL, false, $context);
    if ($response !== false) {
        $resData = json_decode($response, true);
        $textOutput = $resData['candidates'][0]['content']['parts'][0]['text'] ?? '';
        
        // Clean up markdown block if Gemini included it
        $textOutput = trim(preg_replace('/^```json|```$/', '', trim($textOutput)));
        $parsed = json_decode($textOutput, true);
        if (is_array($parsed) && count($parsed) >= 3) {
            $recommendations = array_slice($parsed, 0, 3);
        }
    }
}

// 6. Fallback matching algorithm (runs if Gemini fails or is offline)
if (empty($recommendations)) {
    // We match candidates based on user's learning interests
    $topMatches = [];
    $stretches  = [];
    $easyWins   = [];

    foreach ($availableMentors as $m) {
        $isWanted = in_array($m['skill_name'], $learnList, true);
        if ($isWanted) {
            $topMatches[] = $m;
        } else {
            $stretches[] = $m;
        }
    }

    // fallback stubs populated with DB data
    $m1 = !empty($topMatches) ? $topMatches[0] : (!empty($availableMentors) ? $availableMentors[0] : null);
    $m2 = count($topMatches) > 1 ? $topMatches[1] : (!empty($stretches) ? $stretches[0] : null);
    $m3 = !empty($availableMentors) ? end($availableMentors) : null;

    if ($m1) {
        $recommendations[] = [
            'tag' => 'Top match',
            'title' => "Pair with {$m1['user_name']} on {$m1['skill_name']}",
            'reason' => "Perfect alignment! Closes your learning gap in {$m1['skill_name']} at {$m1['credit_rate']} credits/hr."
        ];
    }
    if ($m2) {
        $recommendations[] = [
            'tag' => 'Stretch',
            'title' => "Try {$m2['user_name']}'s {$m2['skill_name']} session",
            'reason' => "Broaden your skill horizons. Highly rated mentor in {$m2['location']}."
        ];
    }
    if ($m3) {
        $recommendations[] = [
            'tag' => 'Easy win',
            'title' => "Connect with {$m3['user_name']} for {$m3['skill_name']}",
            'reason' => "Quick introductory exchange with a trusted {$m3['trust_tier']} tier mentor."
        ];
    }
}

json_success($recommendations);
