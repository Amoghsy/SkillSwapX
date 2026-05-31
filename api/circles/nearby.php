<?php
// api/circles/nearby.php — GET /api/circles/nearby?lat=&lng=&radius=25

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$lat    = (float)($_GET['lat']    ?? 0);
$lng    = (float)($_GET['lng']    ?? 0);
$radius = (float)($_GET['radius'] ?? 25);   // km

if (!$lat || !$lng) json_error('lat and lng are required', 400);

$db   = Database::getInstance();
// Haversine formula via MySQL
$stmt = $db->prepare(
    "SELECT sc.id, sc.name, sc.topic, sc.location, sc.weekly_schedule, sc.max_members,
            sc.description, sc.created_at,
            u.name AS creator_name,
            COUNT(cm.user_id) AS member_count,
            (6371 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(sc.latitude)) *
                COS(RADIANS(sc.longitude) - RADIANS(:lng)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(sc.latitude))
            )) AS distance_km
     FROM skill_circles sc
     JOIN users u ON u.id = sc.created_by
     LEFT JOIN circle_members cm ON cm.circle_id = sc.id
     WHERE sc.is_active = 1
       AND sc.latitude IS NOT NULL
     GROUP BY sc.id
     HAVING distance_km <= :radius
     ORDER BY distance_km ASC
     LIMIT 30"
);
$stmt->execute([':lat' => $lat, ':lng' => $lng, ':radius' => $radius]);
json_success($stmt->fetchAll());
