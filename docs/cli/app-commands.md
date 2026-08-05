---
title: App, Cache & Queue Commands
description: "Manage application keys, route and data caches, JWT secrets, and queue workers using LitePHP's env, key, cache, route, and queue CLI commands."
---

# App, Cache & Queue Commands

> Manage application keys, route and data caches, JWT secrets, and queue workers using LitePHP's env, key, cache, route, and queue CLI commands.

### env:init

```bash
php lite env:init
```

```
[INFO] .env created from .env.example
       → Open .env and update your credentials.
```

If `.env` exists already:

```
[WARN] .env already exists — skipping.
       Delete .env manually if you want to regenerate.
```

> **Note:** Requires `.env.example` in project root. Commit `.env.example`, gitignore `.env`.

### key:generate

```bash
php lite key:generate
```

```
Application key generated successfully.
APP_KEY=base64:7X9mK3...
```

32-byte random string, `base64:<value>` format. Replaces `APP_KEY` in-place if it exists, or appends it.

> **Warning:** Regenerating `APP_KEY` in production invalidates all active sessions — run once during initial setup only. Store in a secrets manager, don't regenerate on every deploy.

### jwt:secret

```bash
php lite jwt:secret
```

```
JWT secret generated successfully.
APP_JWT_SECRET=mXqT8r...
```

Raw base64 string (no `base64:` prefix, unlike `APP_KEY`). Replaces `APP_JWT_SECRET` in-place if present.

> **Warning:** Changing `APP_JWT_SECRET` in production invalidates every outstanding JWT — all logged-in users signed out immediately. Run once during setup or as a deliberate rotation.

### route:cache

```bash
php lite route:cache
```

```
[INFO] Routes cached successfully.
```

Serialises routes from `app/Routes/web.php` to `storage/cache/routes.php` — subsequent requests load the cache directly.

> **Tip:** Run as part of your deployment pipeline, after pulling code and before restarting the web server.

### route:clear

```bash
php lite route:clear
```

```
[INFO] Route cache cleared.
```

```
[WARN] No route cache found.
```

> **Note:** Always run `route:clear` (or `cache:clear`) locally after adding/renaming/removing routes — a stale cache serves the old routing table.

### cache:clear

```bash
php lite cache:clear
```

```
[OK] Cache cleared. 14 file(s) removed.
```

| Cache type | Location |
|---|---|
| Application data cache | `storage/cache/data/` |
| Compiled view cache | `storage/cache/views/` |
| Route cache | `storage/cache/routes.php` |

> **Tip:** Use `cache:clear` in development when template/routing changes don't seem to take effect. In production prefer targeted commands (`route:clear`) to avoid unnecessarily clearing data caches.

### queue:work

```bash
php lite queue:work                              # continuous — default queue, 3s poll interval
php lite queue:work --once                        # one job then exit (ideal for cron)
php lite queue:work --queue=emails                 # only 'emails' queue
php lite queue:work --sleep=5                       # 5s between polls when empty
php lite queue:work --queue=notifications --sleep=2 # combined
```

```
[INFO] Starting queue worker on [default]...
       Press Ctrl+C to stop.
```

> **Note:** `queue:work` calls `set_time_limit(0)` — long jobs are never killed mid-execution. `--once` mode runs silently, safe for cron.

> **Warning:** A plain `queue:work` process stops if the SSH session ends or the server restarts — use Supervisor in production.

### queue:failed

```bash
php lite queue:failed
```

```
  ID     Queue        Failed At                      Exception
  ──────────────────────────────────────────────────────────────────────────────────
  12     emails       2024-06-10 14:30:22            Connection refused at Mailer.php:87
  11     default      2024-06-10 13:12:05            Call to undefined method ...
```

Up to 50 rows, newest first — `id`, queue name, failure time, first 120 chars of the exception. Use `id` to look up the full trace in logs or the `failed_jobs` table.

```
[INFO] No failed jobs.
```

### Production Deployment Checklist

```bash
php lite env:init
# edit .env: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD, etc.

php lite key:generate      # skip if APP_KEY already set
php lite jwt:secret        # skip if APP_JWT_SECRET already set (JWT auth only)

php lite migrate           # auto-creates DB if needed

php lite queue:migrate     # only needed on first deployment (queues)

php lite route:cache       # after every code deployment
```

```ini
# .env — production
APP_ENV=production
APP_DEBUG=false
```

> **Warning:** Never run with `APP_DEBUG=true` in production — exposes stack traces and config values.

Supervisor entry for the queue worker:

```ini
[program:litephp-worker]
command=php /var/www/myapp/lite queue:work --queue=default --sleep=3
autostart=true
autorestart=true
stderr_logfile=/var/log/litephp-worker.err.log
stdout_logfile=/var/log/litephp-worker.out.log
```

```bash
supervisorctl reread && supervisorctl update
```
