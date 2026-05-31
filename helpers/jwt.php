<?php
// helpers/jwt.php — lightweight JWT without a library dependency

declare(strict_types=1);

class JWT
{
    // ── Encode ────────────────────────────────────────────────
    public static function encode(array $payload, int $expiry = JWT_EXPIRY): string
    {
        $header  = self::b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;
        $body    = self::b64url(json_encode($payload));
        $sig     = self::b64url(hash_hmac('sha256', "{$header}.{$body}", JWT_SECRET, true));
        return "{$header}.{$body}.{$sig}";
    }

    // ── Decode ────────────────────────────────────────────────
    public static function decode(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) throw new RuntimeException('Invalid token structure');

        [$header, $body, $sig] = $parts;
        $expected = self::b64url(hash_hmac('sha256', "{$header}.{$body}", JWT_SECRET, true));

        if (!hash_equals($expected, $sig)) throw new RuntimeException('Token signature invalid');

        $payload = json_decode(self::b64urlDecode($body), true);
        if ($payload['exp'] < time()) throw new RuntimeException('Token expired');

        return $payload;
    }

    // ── Refresh token (random 64-byte hex) ───────────────────
    public static function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(64));
    }

    // ── Helpers ───────────────────────────────────────────────
    private static function b64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }
}
