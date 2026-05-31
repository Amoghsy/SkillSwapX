<?php
// helpers/response.php — JSON response helpers

declare(strict_types=1);

function json_success(mixed $data = null, int $code = 200, string $message = 'success'): never
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => $message, 'data' => $data]);
    exit;
}

function json_error(string $message, int $code = 400, array $errors = []): never
{
    http_response_code($code);
    header('Content-Type: application/json');
    $body = ['status' => 'error', 'message' => $message];
    if (!empty($errors)) $body['errors'] = $errors;
    echo json_encode($body);
    exit;
}

function get_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) json_error('Invalid JSON body', 400);
    return $data;
}

// ── Validation ────────────────────────────────────────────────
function validate(array $data, array $rules): array
{
    $errors = [];
    foreach ($rules as $field => $rule) {
        $parts    = explode('|', $rule);
        $required = in_array('required', $parts);
        $value    = $data[$field] ?? null;

        if ($required && ($value === null || $value === '')) {
            $errors[$field] = "{$field} is required";
            continue;
        }
        if ($value === null) continue;

        foreach ($parts as $check) {
            if ($check === 'required') continue;
            if ($check === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $errors[$field] = "{$field} must be a valid email";
            }
            if (str_starts_with($check, 'min:')) {
                $min = (int)substr($check, 4);
                if (strlen((string)$value) < $min) $errors[$field] = "{$field} must be at least {$min} characters";
            }
            if (str_starts_with($check, 'max:')) {
                $max = (int)substr($check, 4);
                if (strlen((string)$value) > $max) $errors[$field] = "{$field} must not exceed {$max} characters";
            }
            if ($check === 'int' && !is_numeric($value)) {
                $errors[$field] = "{$field} must be an integer";
            }
        }
    }
    if (!empty($errors)) json_error('Validation failed', 422, $errors);
    return $data;
}
