---
title: Security Headers
description: "LitePHP applies OWASP-recommended security headers to every response automatically. Learn what each header does and how to customise CSP, CORS, and password hashing."
---

# Security Headers

> LitePHP applies OWASP-recommended security headers to every response automatically. Learn what each header does and how to customise CSP, CORS, and password hashing.

`SecurityHeadersMiddleware` sets the full OWASP Secure Headers baseline on every response — no configuration required.

### Headers Applied Automatically

| Header | Default Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; ...` | Restricts resource loading, prevents XSS |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS for one year (HTTPS requests only) |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Stops MIME-sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits URL info sent via Referer |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context from other origins |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents other origins loading your resources |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks legacy Flash/PDF cross-domain abuse |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Disables unneeded browser features |
| `X-XSS-Protection` | `0` | Disables legacy XSS auditor (CSP is the real protection) |

> **Note:** `Strict-Transport-Security` only sent on HTTPS — LitePHP checks `$_SERVER['HTTPS']` and `X-Forwarded-Proto` first.

### Registering the Middleware

```php
use Core\Middleware\SecurityHeadersMiddleware;

$kernel->global([
    SecurityHeadersMiddleware::class,
    // ... other global middleware
]);
```

### Vite Development Mode

LitePHP detects `public/hot` and automatically relaxes CSP to allow Vite's dev-server URL for `script-src`, `style-src`, `font-src`, `connect-src`. Production CSP stays strict — the two never drift out of sync.

### Customising the CSP

```php
namespace App\Middleware;
use Core\Middleware\SecurityHeadersMiddleware as BaseMiddleware;

class SecurityHeaders extends BaseMiddleware
{
    protected array $cspDirectives = [
        'default-src'     => ["'self'"],
        'script-src'      => ["'self'", 'https://cdn.jsdelivr.net', 'https://www.googletagmanager.com'],
        'style-src'       => ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
        'font-src'        => ["'self'", 'https://fonts.gstatic.com'],
        'img-src'         => ["'self'", 'data:', 'https:'],
        'object-src'      => ["'none'"],
        'base-uri'        => ["'self'"],
        'form-action'     => ["'self'"],
        'connect-src'     => ["'self'"],
        'frame-ancestors' => ["'self'"],
    ];
}
```

```php
$kernel->global([\App\Middleware\SecurityHeaders::class]);
```

> **Tip:** Set `$cspDirectives = []` in a subclass to disable CSP entirely (not recommended for production).

### Customising the Permissions Policy

```php
protected array $permissionsPolicy = [
    'camera'      => '(self)',
    'microphone'  => '()',
    'geolocation' => '(self)',
    'payment'     => '()',
    'usb'         => '()',
];
```

### CORS Configuration

```php
// config/cors.php
return [
    'allowed_origins'   => ['https://yourapp.com', 'https://admin.yourapp.com'],
    'allowed_methods'   => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_headers'   => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers'   => [],
    'allow_credentials' => false,
    'max_age'           => 86400,
];
```

> **Warning:** Never set `allow_credentials: true` with `allowed_origins: ['*']` — LitePHP only sends `Access-Control-Allow-Credentials: true` for explicitly whitelisted origins, never wildcards.

Open API to any origin (public, unauthenticated only):

```php
'allowed_origins'   => ['*'],
'allow_credentials' => false, // must be false with wildcard
```

### Password Hashing

`Hash`, backed by native bcrypt, default cost **12**:

```php
use Core\Support\Hash;

$hashed = Hash::make('user-password');
$hashed = bcrypt('user-password'); // global helper
```

```php
// verify at login
if (Hash::check($request->input('password'), $user->password)) { /* match */ }
```

```php
// rehash if cost factor changed
if (Hash::needsRehash($user->password)) {
    $user->update(['password' => Hash::make($request->input('password'))]);
}
```

```php
// bootstrap — higher cost = slower = harder to brute-force
Hash::setCost(12); // valid range 4–31, default 12
```

> **Note:** `Hash::check()` validates the second arg is a well-formed bcrypt hash (starts with `$2`, length 60) — swapped arguments throw `InvalidArgumentException` rather than silently returning `false`.
