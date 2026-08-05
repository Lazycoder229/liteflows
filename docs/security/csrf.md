---
title: CSRF
description: "Learn how LitePHP automatically guards every state-changing request from Cross-Site Request Forgery attacks using per-session tokens and automatic rotation."
---

# CSRF

> Learn how LitePHP automatically guards every state-changing request from Cross-Site Request Forgery attacks using per-session tokens and automatic rotation.

Every POST/PUT/PATCH/DELETE web request must carry a valid CSRF token — verified before your controller runs, no wiring needed.

### How It Works

1. **Token generated per session** — `Session::csrfToken()` creates a cryptographically random token at session start.
2. **Token embedded in your form** — `csrf_field()` helper or `@csrf` directive renders a hidden input.
3. **Request arrives** — `VerifyCsrfToken` middleware intercepts every POST/PUT/PATCH/DELETE and reads the submitted token from body or headers.
4. **Verified and rotated** — compared against the session value; on success the token rotates (single-use); on failure the request is rejected with HTTP 419.

### Adding the Token to Forms

```html
<form method="POST" action="/posts">
    <?= csrf_field() ?>
    <input type="text" name="title" placeholder="Post title">
    <button type="submit">Create Post</button>
</form>
```

Emits:

```html
<input type="hidden" name="_csrf_token" value="a1b2c3d4e5f6...">
```

> **Tip:** `@csrf` compiles to the same hidden input in templating layers that support directives.

### CSRF in AJAX / Fetch

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

```javascript
const token = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
    body: JSON.stringify({ title: 'New Post' }),
});
```

SPA frameworks setting cookies can send `X-XSRF-TOKEN` instead — LitePHP accepts it.

### Token Locations Checked

Checked in order, first non-empty value wins:

| Location | Key / Header |
|---|---|
| POST body | `_csrf_token` |
| POST body (alternate) | `_token` |
| Request header | `X-CSRF-TOKEN` |
| Request header (SPA cookie) | `X-XSRF-TOKEN` |

### API Routes Are Exempt

Requests with `Authorization: Bearer` **and** JSON content type skip CSRF automatically (stateless, no cookies):

```javascript
fetch('/api/posts', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer eyJ...', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Post' }),
});
```

### Excluding Specific Routes

```php
namespace App\Middleware;

class VerifyCsrfToken extends \Core\Middleware\VerifyCsrfToken
{
    protected array $except = [
        '/webhooks/*',
        '/stripe/webhook',
        '/github/callback',
    ];
}
```

Wildcard matching via `fnmatch()` — `/webhooks/*` excludes any path starting with `/webhooks/`.

> **Warning:** Only exclude genuine machine-to-machine routes — never routes that process user-submitted forms.

### Token Rotation

After every successful verification, `Session::rotateCsrfToken()` replaces the token — single-use. A 30-second grace window lets a tab that loaded a form just before rotation still submit without a spurious 419.

### Manual Token Access

```php
$token = csrf_token(); // raw string — e.g. for embedding in JSON responses
$html  = csrf_field();  // full hidden <input> — <input type="hidden" name="_csrf_token" value="a1b2c3...">
```

### On Failure

**Web/browser:** HTTP 419, flashed error "Your session has expired. Please try again." — display via `errors('csrf')`.

**AJAX/JSON:**

```json
{ "message": "CSRF token mismatch." }
```
