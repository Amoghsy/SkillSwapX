<?php
// api/skills/user_add.php — POST /api/skills/user  (add a skill to own profile)

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();
$body    = get_json_body();

validate($body, [
    'skill_id'       => 'required|int',
    'type'           => 'required',
    'proficiency'    => 'required',
    'credit_rate'    => 'int',
    'session_format' => '',
]);

$validTypes       = ['teach', 'learn'];
$validProficiency = ['Beginner', 'Intermediate', 'Advanced'];
$validFormats     = ['online', 'offline', 'both'];

if (!in_array($body['type'], $validTypes, true))          json_error('type must be teach or learn', 422);
if (!in_array($body['proficiency'], $validProficiency, true)) json_error('Invalid proficiency', 422);

$db = Database::getInstance();

// Verify skill exists
$check = $db->prepare('SELECT id FROM skills WHERE id = ?');
$check->execute([$body['skill_id']]);
if (!$check->fetch()) json_error('Skill not found', 404);

try {
    $stmt = $db->prepare(
        'INSERT INTO user_skills (user_id, skill_id, type, proficiency, credit_rate, session_format, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $payload['sub'],
        (int)$body['skill_id'],
        $body['type'],
        $body['proficiency'],
        (int)($body['credit_rate'] ?? 5),
        in_array($body['session_format'] ?? '', $validFormats) ? $body['session_format'] : 'online',
        $body['description'] ?? null,
    ]);
    json_success(['id' => (int)$db->lastInsertId()], 201, 'Skill added');
} catch (PDOException $e) {
    json_error('You already have this skill listed as ' . $body['type'], 409);
}
