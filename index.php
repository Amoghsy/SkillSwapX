<?php
// index.php — front controller & router

declare(strict_types=1);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/helpers/response.php';

setCorsHeaders();
header('Content-Type: application/json');

// ── Parse request ─────────────────────────────────────────────
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim(str_replace('/api', '', $uri), '/') ?: '/';
$method = $_SERVER['REQUEST_METHOD'];

// ── Route table ───────────────────────────────────────────────
//  [METHOD, regex pattern, file to include]
$routes = [
    // AUTH
    ['POST', '#^/auth/register$#',            'api/auth/register.php'],
    ['POST', '#^/auth/login$#',               'api/auth/login.php'],
    ['POST', '#^/auth/refresh$#',             'api/auth/refresh.php'],
    ['POST', '#^/auth/logout$#',              'api/auth/logout.php'],
    ['POST', '#^/auth/google$#',              'api/auth/google.php'],
    ['POST', '#^/auth/github$#',              'api/auth/github.php'],

    // USERS
    ['GET',  '#^/users/me$#',                 'api/users/me.php'],
    ['PUT',  '#^/users/me$#',                 'api/users/update.php'],
    ['GET',  '#^/users/(\d+)/profile$#',      'api/users/profile.php'],

    // SKILLS
    ['GET',  '#^/skills$#',                   'api/skills/list.php'],
    ['GET',  '#^/skills/search$#',            'api/skills/search.php'],
    ['POST', '#^/skills/user$#',              'api/skills/user_add.php'],
    ['GET',  '#^/skills/user$#',              'api/skills/user_list.php'],
    ['DELETE','#^/skills/user/(\d+)$#',       'api/skills/user_delete.php'],
    ['GET',  '#^/skills/match$#',              'api/skills/match.php'],
    ['GET',  '#^/skills/recommendations$#',   'api/skills/recommendations.php'],

    // SWAP REQUESTS
    ['POST', '#^/swaps/request$#',            'api/swaps/create.php'],
    ['GET',  '#^/swaps$#',                    'api/swaps/list.php'],
    ['GET',  '#^/swaps/(\d+)$#',              'api/swaps/get.php'],
    ['PUT',  '#^/swaps/(\d+)/accept$#',       'api/swaps/accept.php'],
    ['PUT',  '#^/swaps/(\d+)/reject$#',       'api/swaps/reject.php'],
    ['PUT',  '#^/swaps/(\d+)/cancel$#',       'api/swaps/cancel.php'],

    // SESSIONS
    ['GET',  '#^/sessions$#',                 'api/sessions/list.php'],
    ['GET',  '#^/sessions$#',                 'api/sessions/list.php'],
    ['PUT',  '#^/sessions/(\d+)/complete$#',  'api/sessions/complete.php'],
    ['POST', '#^/sessions/(\d+)/feedback$#',  'api/sessions/feedback.php'],

    // CREDITS
    ['GET',  '#^/credits/balance$#',          'api/credits/balance.php'],
    ['GET',  '#^/credits/history$#',          'api/credits/history.php'],
    ['POST', '#^/credits/buy$#',              'api/credits/buy.php'],

    // UPLOADS
    ['POST', '#^/uploads/video$#',            'api/uploads/video.php'],

    // SKILL CIRCLES
    ['GET',  '#^/circles$#',                  'api/circles/list.php'],
    ['GET',  '#^/circles/nearby$#',           'api/circles/nearby.php'],
    ['POST', '#^/circles$#',                  'api/circles/create.php'],
    ['GET',  '#^/circles/(\d+)$#',            'api/circles/get.php'],
    ['POST', '#^/circles/(\d+)/join$#',       'api/circles/join.php'],
    ['DELETE','#^/circles/(\d+)/leave$#',     'api/circles/leave.php'],

    // ROADMAP (proxies to Python FastAPI)
    ['GET',  '#^/roadmap/generate$#',         'api/roadmap/generate.php'],

    // NOTIFICATIONS
    ['GET',  '#^/notifications$#',            'api/users/notifications.php'],
    ['PUT',  '#^/notifications/(\d+)/read$#', 'api/users/notification_read.php'],
];

// ── Match & dispatch ──────────────────────────────────────────
foreach ($routes as [$routeMethod, $pattern, $file]) {
    if ($method !== $routeMethod) continue;
    if (preg_match($pattern, $uri, $matches)) {
        // expose URL params as $urlParams
        $GLOBALS['urlParams'] = array_slice($matches, 1);
        $target = __DIR__ . '/' . $file;
        if (!file_exists($target)) {
            json_error("Handler not found: {$file}", 500);
        }
        require $target;
        exit;
    }
}

json_error('Route not found', 404);
