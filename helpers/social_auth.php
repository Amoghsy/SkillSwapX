<?php

declare(strict_types=1);

require_once __DIR__ . '/jwt.php';

function b64urlDecode(string $value): string
{
    return base64_decode(strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4), true) ?: '';
}

function httpJson(string $url, array $options = []): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => $options['headers'] ?? ['Accept: application/json'],
    ]);

    if (isset($options['body'])) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $options['body']);
    }

    $response = curl_exec($ch);
    $status   = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($response === false || $status < 200 || $status >= 300) {
        throw new RuntimeException($error ?: "Provider request failed with HTTP {$status}");
    }

    $data = json_decode($response, true);
    if (!is_array($data)) {
        throw new RuntimeException('Provider returned an invalid JSON response');
    }
    return $data;
}

function googleCertificates(): array
{
    $cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'skillswap_google_certs.json';
    if (is_file($cacheFile) && filemtime($cacheFile) > time() - 3600) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);
        if (is_array($cached)) return $cached;
    }

    $certificates = httpJson('https://www.googleapis.com/oauth2/v1/certs');
    @file_put_contents($cacheFile, json_encode($certificates), LOCK_EX);
    return $certificates;
}

function verifyGoogleCredential(string $credential): array
{
    if (GOOGLE_CLIENT_ID === '') {
        throw new RuntimeException('Google sign-in is not configured');
    }

    $parts = explode('.', $credential);
    if (count($parts) !== 3) throw new RuntimeException('Invalid Google ID token');

    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
    $header  = json_decode(b64urlDecode($encodedHeader), true);
    $payload = json_decode(b64urlDecode($encodedPayload), true);
    if (!is_array($header) || !is_array($payload) || ($header['alg'] ?? '') !== 'RS256') {
        throw new RuntimeException('Invalid Google ID token');
    }

    $certificate = googleCertificates()[$header['kid'] ?? ''] ?? null;
    if (!$certificate || openssl_verify(
        "{$encodedHeader}.{$encodedPayload}",
        b64urlDecode($encodedSignature),
        $certificate,
        OPENSSL_ALGO_SHA256
    ) !== 1) {
        throw new RuntimeException('Google ID token signature is invalid');
    }

    $issuer = $payload['iss'] ?? '';
    if (!in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)) {
        throw new RuntimeException('Google ID token issuer is invalid');
    }
    if (($payload['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
        throw new RuntimeException('Google ID token audience is invalid');
    }
    if (($payload['exp'] ?? 0) < time() || ($payload['nbf'] ?? 0) > time()) {
        throw new RuntimeException('Google ID token has expired or is not active');
    }
    if (($payload['email_verified'] ?? false) !== true) {
        throw new RuntimeException('Google account email is not verified');
    }

    return $payload;
}

function createSocialOnboardingToken(string $provider, string $providerId, string $email, string $name, ?string $avatar): string
{
    return JWT::encode([
        'purpose'     => 'social_onboarding',
        'provider'    => $provider,
        'provider_id' => $providerId,
        'email'       => strtolower($email),
        'name'        => $name,
        'avatar_url'  => $avatar,
    ], 600);
}

function socialOnboardingResponse(string $provider, string $providerId, string $email, string $name, ?string $avatar): array
{
    return [
        'exists'           => false,
        'provider'         => $provider,
        'email'            => strtolower($email),
        'name'             => $name,
        'avatar_url'       => $avatar,
        'onboarding_token' => createSocialOnboardingToken($provider, $providerId, $email, $name, $avatar),
    ];
}
