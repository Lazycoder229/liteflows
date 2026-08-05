---
title: Middleware
description: "Learn how to use middleware in LitePHP to filter HTTP requests — handle authentication, rate limiting, CSRF protection, CORS, and security headers."
---

# Middleware

> Learn how to use middleware in LitePHP to filter HTTP requests — handle authentication, rate limiting, CSRF protection, CORS, and security headers.

Middleware inspects/transforms requests before they reach a controller, and responses before they're sent back. Every request travels through a pipeline of middleware layers.

### What Is Middleware?

Any class implementing `Core\Middleware\Middleware` with a `handle()` method, receiving `Request`, `Response`, and a `$next` callable:

```php
namespace App\Middleware;
use Core\Http\Request;
use Core\Http\Response;
use Core\Middleware\Middleware;

class AuthMiddleware implements Middleware
{
    public function handle(Request $request, Response $response, callable $next): mixed
    {
        if (!auth()->check()) {
            return $response->redirect('/login');
        }
        return $next($request, $response);
    }
}
```

Common use cases: authentication/authorization, rate limiting, security headers, CSRF protection, CORS, logging/auditing.

### Creating Middleware

```bash
php lite make:middleware AuthMiddleware
```

Creates `App/Middleware/AuthMiddleware.php`. Return `$next($request, $response)` to continue; return any response directly to stop the pipeline.

### Registering Middleware

Three approaches, combinable:

**1. PHP Attribute (recommended)** — self-documenting, auto-discovered at boot:

```php
namespace App\Middleware;
use Core\Http\Request;
use Core\Http\Response;
use Core\Middleware\Middleware;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'web', alias: 'auth')]
class AuthMiddleware implements Middleware
{
    public function handle(Request $request, Response $response, callable $next): mixed
    {
        if (!auth()->check()) return $response->redirect('/login');
        return $next($request, $response);
    }
}
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `group` | `string` | `'web'` | `'global'`, `'web'`, or `'api'` |
| `alias` | `?string` | `null` | Short name for route definitions |

| Group value | Behaviour |
|---|---|
| `global` | Runs on every request |
| `web` | Runs on `web` group routes |
| `api` | Runs on `api` group routes |

Enable auto-discovery: `$kernel->autoDiscover(app_path('Middleware'), 'App\\Middleware');`

**2. Kernel Registration** — programmatic, in bootstrap:

```php
$kernel->global([SecurityHeadersMiddleware::class]);

$kernel->group('web', [AuthMiddleware::class, VerifyCsrfToken::class]);
$kernel->group('api', [ThrottleMiddleware::class]);

$kernel->alias('auth',     AuthMiddleware::class);
$kernel->alias('throttle', ThrottleMiddleware::class);
```

> **Note:** `global()`/`group()` **merge** with secure defaults (`SecurityHeadersMiddleware` global, `VerifyCsrfToken` web) — you can't accidentally remove them this way.

**3. Route-Level:**

```php
Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth']);

Route::group('/admin', ['auth', 'role:admin'], function () {
    Route::get('/users',         [UserController::class, 'index']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
});
```

Route-level middleware runs **after** global and group middleware.

> **Warning:** `Route::group()` order is `(prefix, middleware, callback)`.

### Parametric Middleware

```php
Route::get('/api/feed', [FeedController::class, 'index'])->middleware(['throttle:60,1']);
Route::post('/login', [AuthController::class, 'store'])->middleware(['throttle:5,1,/login']);
```

```php
class ThrottleMiddleware implements Middleware
{
    public function __construct(
        protected int     $maxAttempts  = 60,
        protected int     $decayMinutes = 1,
        protected ?string $redirectTo   = null,
    ) {}
}
```

Numeric values are cast to `int`; strings (like a redirect path) pass through as-is.

### Built-in Middleware

| Middleware | Default Group | Purpose |
|---|---|---|
| `SecurityHeadersMiddleware` | `global` | OWASP header set: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP, CORP, Permissions-Policy |
| `VerifyCsrfToken` | `web` | Verifies CSRF tokens on `POST`/`PUT`/`PATCH`/`DELETE` from browser sessions |
| `CorsMiddleware` | `api` | Sets `Access-Control-*` headers; handles `OPTIONS` preflight with `204` |
| `ThrottleMiddleware` | `api` | Rate-limits per IP/path via atomic file-cache counter; sends `X-RateLimit-*` headers |

**SecurityHeadersMiddleware** — customise CSP by extending:

```php
namespace App\Middleware;
use Core\Middleware\SecurityHeadersMiddleware as BaseSecurityHeaders;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'global')]
class SecurityHeadersMiddleware extends BaseSecurityHeaders
{
    protected array $cspDirectives = [
        'default-src' => ["'self'"],
        'script-src'  => ["'self'", 'https://cdn.example.com'],
        'img-src'     => ["'self'", 'data:', 'https:'],
        'object-src'  => ["'none'"],
    ];
}
```

HSTS sends only over HTTPS, default 1-year `max-age`; set `$hstsMaxAge = 0` to disable on non-HTTPS.

**CorsMiddleware** — `config/cors.php`:

```php
return [
    'allowed_origins'        => ['https://app.example.com'],
    'allowed_methods'        => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_headers'        => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers'        => [],
    'allow_credentials'      => true,
    'max_age'                => 86400,
    'allow_private_network'  => false,
];
```

> **Warning:** `allowed_origins = ['*']` disables `Access-Control-Allow-Credentials: true` regardless of config — the CORS spec forbids pairing a wildcard origin with credentialed requests.

**ThrottleMiddleware** — atomic `Cache::increment()` avoids race conditions. `429` JSON for API clients over limit; redirect-back with flashed error for browsers.

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
Retry-After: 37        ← only on 429
```

### Middleware Execution Order

1. **Global** — every request.
2. **Group** — routes in a group (`web`/`api`); CSRF/auth typically live here.
3. **Route-level** — only the matched route; per-endpoint concerns.
4. **Controller action** — reached only if every layer calls `$next()`.

Code **after** `$next()` runs on the way back out, once the controller has already produced a response.

### Skipping CSRF for API Routes

`VerifyCsrfToken` auto-skips requests with a Bearer token **and** a JSON `Content-Type`:

```js
fetch('/api/posts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hello' }),
});
```

For webhooks without Bearer tokens, extend `VerifyCsrfToken` and add to `$except`:

```php
namespace App\Middleware;
use Core\Middleware\VerifyCsrfToken as BaseVerifyCsrfToken;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'web')]
class VerifyCsrfToken extends BaseVerifyCsrfToken
{
    protected array $except = ['/webhooks/stripe', '/webhooks/github'];
}
```

HTML forms:

```html
<form method="POST" action="/posts">
    <?= csrf_field() ?>
    <!-- renders: <input type="hidden" name="_csrf_token" value="..."> -->
</form>
```

AJAX:

```html
<meta name="csrf-token" content="<?= csrf_token() ?>">
```

```js
fetch('/posts', {
    method: 'POST',
    headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
});
```

### Terminating Middleware (After-Response Logic)

```php
namespace App\Middleware;
use Core\Http\Request;
use Core\Http\Response;
use Core\Middleware\Middleware;

class RequestLoggerMiddleware implements Middleware
{
    public function handle(Request $request, Response $response, callable $next): mixed
    {
        $start = microtime(true);
        $result = $next($request, $response);
        $duration = round((microtime(true) - $start) * 1000, 2);
        logger()->info("{$request->method()} {$request->path()} — {$duration}ms");
        return $result;
    }
}
```

> **Note:** "Terminating" means after-controller, not after-send — LitePHP doesn't use `fastcgi_finish_request()` by default.

### Best Practices

- Use attribute registration for self-documenting middleware.
- Apply rate limiting to all public API routes; tighter limits (`throttle:5,1`) on login/password-reset/verification.
- Keep global middleware fast — avoid DB queries, external HTTP calls, or heavy computation there.
