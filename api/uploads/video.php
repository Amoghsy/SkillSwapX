<?php
// api/uploads/video.php — POST /api/uploads/video

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$payload = requireAuth();

// Validate file was uploaded
if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    $errCode = $_FILES['video']['error'] ?? -1;
    $errMap  = [
        UPLOAD_ERR_INI_SIZE   => 'File too large (server limit)',
        UPLOAD_ERR_FORM_SIZE  => 'File too large (form limit)',
        UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by extension',
    ];
    json_error($errMap[$errCode] ?? 'Upload failed (unknown error)', 400);
}

$file     = $_FILES['video'];
$maxBytes = 50 * 1024 * 1024; // 50 MB

if ($file['size'] > $maxBytes) {
    json_error('Video file exceeds 50 MB limit', 400);
}

// Validate MIME type and extension
$allowedExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExtensions, true)) {
    json_error('Invalid file type. Allowed: mp4, webm, mov, avi, mkv', 400);
}

// Check real MIME type using finfo
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
$allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/avi'];
if (!in_array($mimeType, $allowedMimes, true)) {
    json_error('Invalid file MIME type. Only video files allowed.', 400);
}

// Generate unique filename
$uploadDir = __DIR__ . '/../../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uniqueName = bin2hex(random_bytes(16)) . '_' . time() . '.' . $ext;
$destPath   = $uploadDir . $uniqueName;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    json_error('Failed to save uploaded file', 500);
}

// Return public URL path
$publicUrl = '/uploads/' . $uniqueName;

json_success([
    'url'      => $publicUrl,
    'filename' => $uniqueName,
    'size'     => $file['size'],
    'mime'     => $mimeType,
], 201, 'Video uploaded successfully');
