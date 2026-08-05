---
title: Rate Limiting
description: "Protect your LitePHP routes from abuse and brute-force attacks using ThrottleMiddleware — configure limits per route, get accurate headers, and handle 429 responses gracefully."
---

# Rate Limiting

> Protect your LitePHP routes from abuse and brute-force attacks using ThrottleMiddleware — configure limits per route, get accurate headers, and handle 429 responses gracefully.

`ThrottleMiddleware` tracks requests per client within a sliding window; atomic counter increment for accuracy under concurrency.

### How It Works

1. Computes a cache key from client IP + requested path.
2. Atomically increments a counter in the app cache.
3. Compares against configured `max_attempts`.
4. Attaches `X-RateLimit-*` headers.
5. Returns 429 and stops processing if exceeded.

### Basic Usage

```php
// 60 requests per minute for all /api routes
Route::group('/api', function () {
    Route::get('/posts',  [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/users',  [UserController::class, 'index']);
}, ['throttle:60,1']);
```

### Route-Level Rate Limiting

```php
// Strict — 5 attempts per 15 minutes
Route::post('/login', [AuthController::class, 'login'])->middleware(['throttle:5,15']);

Route::post('/password/reset', [PasswordController::class, 'send'])->middleware(['throttle:3,60']);

// Generous — public reads
Route::get('/posts', [PostController::class, 'index'])->middleware(['throttle:120,1']);
```

### Response Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
```

When exceeded:

```
Retry-After: 47
X-RateLimit-Remaining: 0
```

### When the Limit Is Exceeded

**API/AJAX:** HTTP 429 with JSON body:

```json
{ "message": "Too many requests. Please try again in 1 minute(s)." }
```

Clients should read `Retry-After` and delay accordingly.

**Web/browser:** redirected back with a flashed error — display via `errors('throttle')`.

### Custom Redirect for Web Forms

```php
// throttle:max_attempts,minutes,redirect_path
Route::post('/contact', [ContactController::class, 'store'])->middleware(['throttle:3,60,/contact']);
```

### Rate Limiting by IP

Key derived from `$request->ip()`. Respects trusted-proxy config for `X-Forwarded-For`; without it, always uses the direct connection IP (prevents spoofing).

### Configuring Trusted Proxies

```php
// config/app.php
return ['trusted_proxies' => ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']];
```

```ini
APP_TRUST_PROXIES=10.0.0.0/8,172.16.0.0/12
```

> **Warning:** Without trusted proxies configured, clients can forge `X-Forwarded-For` to bypass rate limiting — always specify actual proxy CIDR ranges.

### Choosing Sensible Limits

> **Tip:** Apply rate limiting to **all** public-facing routes, not just auth:
> - Login / register / password reset — `throttle:5,15`
> - Email / contact forms — `throttle:3,60`
> - General API reads — `throttle:120,1`
> - General API writes — `throttle:30,1`

### Atomic Counters

The throttle counter uses atomic increment — two simultaneous requests can never both observe the same hit count and both slip past the limit.
