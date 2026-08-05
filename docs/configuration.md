---
title: Configuration
description: "Learn how LitePHP's layered config system works, how to use .env variables, read config values at runtime, and override framework defaults."
---

# Configuration

> Learn how LitePHP's layered config system works, how to use .env variables, read config values at runtime, and override framework defaults.

LitePHP uses a two-layer configuration system. The framework ships defaults inside `Core/Config/defaults/` (one PHP file per concern). Your project places matching files in `config/` to override individual keys. At boot, `Core\Config\Config::load()` reads defaults first, then recursively merges your overrides on top using `array_replace_recursive`. Most applications never need a `config/` file — `.env` is enough.

### Environment variables

`Core\Config\Env::load()` loads `.env` early in boot, before any config file is read. The parser handles `#` comments, strips surrounding quotes from values, and populates both `$_ENV` and an internal static registry. Access values anywhere with the `env()` helper.

Complete example `.env`:

```ini
# Application
APP_NAME=AgriConnect
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:3000
APP_TIMEZONE=UTC
APP_LOCALE=en
APP_TRUSTED_PROXIES=
VIEW_CACHE=false

# Cache
CACHE_DRIVER=file

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agriconnect
DB_USERNAME=root
DB_PASSWORD=
DB_PERSISTENT=false

# Session
SESSION_NAME=agriconnect_session
SESSION_LIFETIME=120
SESSION_DOMAIN=
SESSION_SAMESITE=Lax
SESSION_SECURE_COOKIE=false

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_CREDENTIALS=false
CORS_MAX_AGE=86400
CORS_ALLOW_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_ALLOW_HEADERS=Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization
CORS_EXPOSE_HEADERS=Content-Length,X-Foo,Authorization
CORS_ALLOW_PRIVATE_NETWORK=false

# Mail
MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@agriconnect.com
MAIL_FROM_NAME=AgriConnect

# Auth & Security
APP_KEY=
APP_JWT_SECRET=
AUTH_MODEL=App\Models\User
JWT_TTL=3600

# Vite
VITE_DEV=true
VITE_URL=http://localhost:5173
```

> **Warning:** Never commit `.env` to version control — it contains `APP_KEY`, `APP_JWT_SECRET`, and database credentials. Make sure `.gitignore` includes `.env`.

> **Warning:** LitePHP throws a `RuntimeException` at boot if `APP_ENV=production` and `APP_DEBUG=true` are both set. Always set `APP_DEBUG=false` before deploying.

### Reading config values

```php
$name = config('app.name');            // "AgriConnect"
$host = config('database.connections.mysql.host');  // "127.0.0.1"
$tz = config('app.timezone', 'UTC');   // fallback default
$key = env('APP_KEY');                  // reads .env directly, bypassing config layer
```

Implementation (`Core\Config\Config::get()`):

```php
public static function get(string $key, mixed $default = null): mixed
{
    $segments = explode('.', $key);
    $value    = self::$items;

    foreach ($segments as $segment) {
        if (!isset($value[$segment])) {
            return $default;
        }
        $value = $value[$segment];
    }

    return $value;
}
```

### Configuration file reference

**`app.php`**

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `name` | `APP_NAME` | `AgriConnect` | Display name used in views and email subjects |
| `env` | `APP_ENV` | `local` | Environment: `local`, `staging`, or `production` |
| `debug` | `APP_DEBUG` | `false` | Show detailed error pages. Must be `false` in production |
| `url` | `APP_URL` | `http://localhost:3000` | Base URL used by `url()`, `asset()`, and `redirect()` |
| `timezone` | `APP_TIMEZONE` | `UTC` | PHP default timezone |
| `locale` | `APP_LOCALE` | `en` | Application locale |
| `trusted_proxies` | `APP_TRUSTED_PROXIES` | `[]` | Comma-separated list of trusted proxy IPs |

**`database.php`**

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `default` | `DB_CONNECTION` | `mysql` | Name of the active connection |
| `connections.mysql.host` | `DB_HOST` | `127.0.0.1` | Database server hostname |
| `connections.mysql.port` | `DB_PORT` | `3306` | Database server port |
| `connections.mysql.database` | `DB_DATABASE` | `agriconnect` | Database / schema name |
| `connections.mysql.username` | `DB_USERNAME` | `root` | Database user |
| `connections.mysql.password` | `DB_PASSWORD` | (empty) | Database password |
| `connections.mysql.charset` | — | `utf8mb4` | Connection character set |
| `connections.mysql.prefix` | — | (empty) | Optional table name prefix |
| `connections.mysql.persistent` | `DB_PERSISTENT` | `false` | Enable persistent connections (CLI workers only) |

> **Tip:** Leave `DB_PERSISTENT=false` for web requests. Persistent connections only benefit long-running CLI processes like `php lite queue:work`.

**`auth.php`** — consumed by `Auth::configure()` at boot.

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `model` | `AUTH_MODEL` | `App\Models\User` | Fully-qualified User model class name |
| `username_field` | — | `email` | Database column used as the login identifier |
| `password_field` | — | `password` | Database column storing the hashed password |
| `jwt_secret` | `APP_JWT_SECRET` | falls back to `APP_KEY` | Secret key for signing JWT tokens |
| `jwt_ttl` | `JWT_TTL` | `3600` | JWT token lifetime in seconds |
| `token_column` | — | `api_token` | Column used by `TokenGuard` for API Bearer token lookup |

> **Tip:** Always set a dedicated `APP_JWT_SECRET` rather than relying on the `APP_KEY` fallback. Generate one with `php lite jwt:secret`.

**`cache.php`**

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `driver` | `CACHE_DRIVER` | `file` | Cache driver (currently `file`) |
| `path` | — | `storage/cache/data` | Directory where cache entries are stored |

**`mail.php`**

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `driver` | `MAIL_DRIVER` | `smtp` | Mail transport: `smtp` or `sendmail` |
| `host` | `MAIL_HOST` | `smtp.mailtrap.io` | SMTP server hostname |
| `port` | `MAIL_PORT` | `587` | SMTP port (587 = TLS, 465 = SSL, 25 = plain) |
| `username` | `MAIL_USERNAME` | (empty) | SMTP account username |
| `password` | `MAIL_PASSWORD` | (empty) | SMTP account password |
| `encryption` | `MAIL_ENCRYPTION` | `tls` | Encryption: `tls`, `ssl`, or empty for none |
| `from.address` | `MAIL_FROM_ADDRESS` | `noreply@agriconnect.com` | Default sender address |
| `from.name` | `MAIL_FROM_NAME` | `AgriConnect` | Default sender display name |

**`session.php`** — sessions are stored in `storage/framework/sessions/`.

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `name` | `SESSION_NAME` | `agriconnect_session` | Name of the session cookie |
| `lifetime` | `SESSION_LIFETIME` | `120` | Idle timeout in minutes |
| `domain` | `SESSION_DOMAIN` | (empty) | Cookie domain. Set `.example.com` to share across subdomains |
| `samesite` | `SESSION_SAMESITE` | `Lax` | SameSite policy: `Lax`, `Strict`, or `None` |
| `secure` | `SESSION_SECURE_COOKIE` | `false` | Only send cookie over HTTPS |
| `http_only` | — | `true` | Prevent JavaScript from accessing the session cookie |

> **Tip:** Set `SESSION_SECURE_COOKIE=true` and `SESSION_SAMESITE=Strict` in production once running on HTTPS.

**`cors.php`** — controls `CorsMiddleware`.

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `allowed_origins` | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed origins |
| `allowed_methods` | `CORS_ALLOW_METHODS` | `GET,HEAD,PUT,PATCH,POST,DELETE` | Comma-separated list of allowed HTTP methods |
| `allowed_headers` | `CORS_ALLOW_HEADERS` | `Origin,Accept,X-Requested-With,Content-Type,...` | Comma-separated list of allowed request headers |
| `exposed_headers` | `CORS_EXPOSE_HEADERS` | `Content-Length,X-Foo,Authorization` | Headers the browser may expose to JS |
| `max_age` | `CORS_MAX_AGE` | `86400` | Seconds the browser may cache a preflight response |
| `allow_credentials` | `CORS_ALLOW_CREDENTIALS` | `false` | Whether to allow credentials in cross-origin requests |
| `allow_private_network` | `CORS_ALLOW_PRIVATE_NETWORK` | `false` | Support Chrome's Private Network Access checks |

> **Warning:** Never set `CORS_ALLOWED_ORIGINS=*` together with `CORS_ALLOW_CREDENTIALS=true`. Browsers forbid this, and `CorsMiddleware` enforces the same restriction.

**`view.php`**

| Key | `.env` variable | Default | Description |
|---|---|---|---|
| `cache` | `VIEW_CACHE` | `false` | Cache compiled views. Set `true` in production for best performance |

When `VIEW_CACHE=false`, the compiler checks whether each `.lites` file changed since it was last compiled and recompiles automatically. In production with `VIEW_CACHE=true`, the compiled file is used as-is with no filesystem checks per request.

### Overriding defaults

Create a file in `config/` with the same name as the defaults file, returning only the keys you want to change:

```php
<?php
// config/app.php

return [
    'timezone' => 'UTC',
    'locale'   => 'en',
];
```

```php
<?php
// config/database.php

return [
    'connections' => [
        'mysql' => [
            'charset' => 'utf8mb4',
        ],
    ],
];
```

> **Note:** Config files in `config/` are only loaded if the directory exists. You don't need to create it unless you actually need to override a default.