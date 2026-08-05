---
title: JWT Auth
description: "Issue and verify HS256-signed JSON Web Tokens for stateless API and SPA authentication in LitePHP — zero external dependencies required."
---

# JWT Auth

> Issue and verify HS256-signed JSON Web Tokens for stateless API and SPA authentication in LitePHP — zero external dependencies required.

Client receives a signed token at login, sends it back in the `Authorization` header. LitePHP verifies HS256 signatures locally — no external library.

### Setup

```bash
php lite jwt:secret
# Writes APP_JWT_SECRET=<random-64-char-string> to .env
```

> **Warning:** `APP_JWT_SECRET` must be at least 32 characters — LitePHP throws a `RuntimeException` at issue time otherwise. Use `php lite jwt:secret` rather than choosing your own value.

### Configuration

```php
// config/auth.php
return [
    'model'      => App\Models\User::class,
    'jwt_secret' => env('APP_JWT_SECRET'), // falls back to APP_KEY if unset
    'jwt_ttl'    => 3600,                  // seconds
];
```

Override `jwt_ttl` per-token via `JwtGuard::issue()`.

### Issuing a Token

```php
use Core\Auth\Auth;
use Core\Auth\JwtGuard;
use Core\Http\JsonResponse;
use Core\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only(['email', 'password']);

        if (!Auth::attempt($credentials)) {
            return JsonResponse::unauthorized('Invalid credentials');
        }

        $user  = Auth::user();
        $token = JwtGuard::issue([
            'sub'  => $user['id'],
            'name' => $user['name'],
            'role' => $user['role'] ?? 'user',
        ], ttl: 3600);

        return JsonResponse::success(['token' => $token, 'expires_in' => 3600, 'user' => $user]);
    }
}
```

LitePHP automatically adds `iat`, `nbf`, `exp` claims.

> **Tip:** Keep custom claims minimal (`sub`, `role`, etc.) — heavy payloads are sent on every API call.

### Verifying a Token

```php
// verify() — throws on failure
use Core\Auth\JwtGuard;

$token = $request->bearerToken();

try {
    $payload = JwtGuard::verify($token);
    $userId  = $payload['sub'];
    $role    = $payload['role'] ?? 'user';
} catch (\RuntimeException $e) {
    // $e->getMessage(): malformed, bad signature, expired, etc.
    return JsonResponse::unauthorized('Token invalid or expired');
}
```

```php
// decode() — returns null on failure, no try/catch needed
$payload = JwtGuard::decode($token);

if ($payload === null) {
    return JsonResponse::unauthorized('Invalid or expired token');
}
$userId = $payload['sub'];
```

### Auth Middleware for JWT APIs

```php
// app/Middleware/JwtMiddleware.php
namespace App\Middleware;
use Core\Auth\JwtGuard;
use Core\Http\JsonResponse;
use Core\Middleware\Middleware;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'api', alias: 'jwt')]
class JwtMiddleware implements Middleware
{
    public function handle($request, $response, callable $next): mixed
    {
        $token = $request->bearerToken();
        if (!$token) return JsonResponse::unauthorized('Token required');

        $payload = JwtGuard::decode($token);
        if ($payload === null) return JsonResponse::unauthorized('Invalid or expired token');

        $request->setRouteParam('auth_user_id', $payload['sub']);
        $request->setRouteParam('auth_role', $payload['role'] ?? 'user');

        return $next($request, $response);
    }
}
```

```php
// routes/api.php
Route::group('/api/v1', function () {
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
}, ['jwt']);
```

### Sending JWT in Requests

```http
GET /api/v1/posts HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

### Global Helper Functions

```php
$token = jwt_issue(['sub' => $user->id, 'role' => 'admin'], ttl: 3600);
$payload = jwt_verify($token); // throws RuntimeException on failure
```

### Token Payload Structure

| Claim | Type | Description |
|---|---|---|
| `iat` | int | Issued-at timestamp |
| `nbf` | int | Not-valid-before timestamp |
| `exp` | int | Expiry timestamp |
| `sub` | mixed | Subject — typically the user's primary key |

Custom claims (`name`, `role`, etc.) sit at the same level.

### Security Reference

> **Warning:** `alg=none` tokens are always rejected — LitePHP validates the `alg` header before checking the signature; anything not `HS256` is refused.

> **Warning:** Rotating `APP_JWT_SECRET` invalidates every token in circulation — there's no per-token revocation. Plan a re-authentication window.

> **Tip:** Use short TTLs (default 3600s) with a refresh-token flow. Store refresh tokens in the DB for revocability.

> **Tip:** Signature comparison uses `hash_equals()` — constant-time, preventing timing-based signature-oracle attacks.
