---
title: Token Guard
description: "Authenticate API requests using static Bearer tokens stored as SHA-256 hashes — simple, database-backed, instantly revocable API credentials."
---

# Token Guard

> Authenticate API requests using static Bearer tokens stored as SHA-256 hashes — simple, database-backed, instantly revocable API credentials.

Generate a random token, store its SHA-256 hash in the users table; the client sends the plaintext token; LitePHP hashes and compares. Raw token never touches the DB.

### When to Choose Token Guard

**Good fit:** internal tool APIs, server-to-server integrations, simple mobile backends, anywhere instant revocation (nulling a DB column) matters more than statelessness.

**Consider JWT instead:** SPAs needing embedded claims, multi-service architectures wanting signature verification without a DB round-trip, high-traffic APIs.

### Setup

```php
// config/auth.php
return [
    'model'        => App\Models\User::class,
    'token_column' => 'api_token',
];
```

```php
// migration
$table->string('api_token', 64)->nullable()->unique()->after('password');
```

```php
// bootstrap/app.php
use Core\Auth\TokenGuard;
use App\Models\User;

TokenGuard::configure(model: User::class, tokenColumn: 'api_token');
```

### Generating a Token

```php
use Core\Auth\TokenGuard;
use Core\Http\JsonResponse;

class TokenController extends Controller
{
    public function store()
    {
        $user = auth_user();
        $issued = TokenGuard::issue(); // ['token' => '...', 'hash' => '...']

        $userModel = \App\Models\User::find($user['id']);
        $userModel->update(['api_token' => $issued['hash']]); // persist HASH only

        return JsonResponse::success([
            'token' => $issued['token'], // shown once
            'note'  => 'Store this token securely — it cannot be retrieved again.',
        ]);
    }
}
```

> **Warning:** Never store the plaintext token — only the SHA-256 hash.

Lower-level methods:

```php
$plain = TokenGuard::generate(bytes: 40); // 80-char hex string
$hash  = TokenGuard::hash($plain);        // SHA-256 hex string
$user->update(['api_token' => $hash]);
```

### Authenticating Requests

```php
// app/Middleware/TokenAuthMiddleware.php
namespace App\Middleware;
use Core\Auth\TokenGuard;
use Core\Http\JsonResponse;
use Core\Middleware\Middleware;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'api', alias: 'token')]
class TokenAuthMiddleware implements Middleware
{
    public function handle($request, $response, callable $next): mixed
    {
        $user = TokenGuard::fromRequest($request); // Bearer header or ?api_token fallback

        if ($user === null) return JsonResponse::unauthorized('Invalid or missing API token');

        $request->setRouteParam('auth_user_id', $user->id);
        return $next($request, $response);
    }
}
```

```php
// routes/api.php
Route::group('/api', function () {
    Route::get('/account', [AccountController::class, 'show']);
    Route::post('/webhooks', [WebhookController::class, 'store']);
}, ['token']);
```

### Sending the Token

```http
GET /api/account HTTP/1.1
Host: api.example.com
Authorization: Bearer a3f8c1d2e4b5...
```

Or as a query param (less secure — appears in server logs):

```http
GET /api/account?api_token=a3f8c1d2e4b5...
```

> **Warning:** Prefer the `Authorization` header — query strings leak into access logs, browser history, and Referer headers.

### Revoking a Token

```php
$user->update(['api_token' => null]); // immediate — next request 401s
```

### Token Guard vs JWT

| Feature | Token Guard | JWT |
|---|---|---|
| DB lookup per request | Yes | No |
| Stateless | No | Yes |
| Instant revocation | Yes | Requires a blocklist |
| Custom claims in token | No | Yes |
| Secret rotation impact | None | Invalidates all tokens |
| Best for | Simple APIs, internal tools | SPAs, mobile apps, microservices |

> **Tip:** For both instant revocation and stateless verification, combine both: short-lived JWTs (5–15 min) + a DB-stored `TokenGuard` refresh token. Revoke the refresh token to cut off the session at next refresh.
