---
title: Session
description: "Manage user sessions with a static API. Store and retrieve data, send flash messages, repopulate forms after validation failure, and stop session fixation."
---

# Session

> Manage user sessions with a static API. Store and retrieve data, send flash messages, repopulate forms after validation failure, and stop session fixation.

`Session` wraps PHP's native session engine — handles startup, expiry, flash lifecycle, CSRF tokens, secure cookies automatically.

### Basic Operations

```php
use Core\Session;

Session::set('user_preferences', ['theme' => 'dark', 'locale' => 'en']);
$prefs = Session::get('user_preferences');        // null if unset
$theme = Session::get('theme', 'light');            // with default
if (Session::has('user_id')) { /* authenticated */ }
Session::forget('temp_data');
Session::flush(); // wipe entire session
```

```php
$value = session('key', 'default'); // shortcut for Session::get() — reads only
```

### Flash Messages

Survive until the end of the **next** request:

```php
use Core\Session;

Session::flash('success', 'Your post was published!');
Session::flash('error', 'Something went wrong. Please try again.');
Session::flash('info', 'Please verify your email address.');
```

```php
flash('success', 'Profile updated.'); // set
$message = flash('success');           // read, null if absent
```

```html
<?php if (Session::hasFlash('success')): ?>
    <div class="alert alert-success"><?= e(Session::getFlash('success')) ?></div>
<?php endif; ?>
<?php if (Session::hasFlash('error')): ?>
    <div class="alert alert-danger"><?= e(Session::getFlash('error')) ?></div>
<?php endif; ?>
```

> **Note:** Flash values are safe to read multiple times in the same request — swept only at the **next** request's startup.

### Old Input

```html
<form method="POST" action="/register">
    <?= csrf_field() ?>
    <input type="text" name="name" value="<?= e(old('name')) ?>">
    <input type="email" name="email" value="<?= e(old('email')) ?>">
    <?php if (hasError('email')): ?><p class="text-red-500"><?= e(errors('email')) ?></p><?php endif; ?>
    <button type="submit">Register</button>
</form>
```

`old()` returns empty string when no previous input exists.

### Regenerating the Session ID

```php
// after verifying credentials
Session::regenerate();
Session::set('_auth_user', $user->toArray());
```

Calls `session_regenerate_id(true)` — new ID, old session file deleted. Prevents session fixation.

### Destroying a Session

```php
Session::destroy();
redirect('/login');
```

Clears `$_SESSION`, expires the cookie, calls `session_destroy()`.

### Auth Helpers

```php
Session::setUser($user->toArray()); // stores user, also calls regenerate() internally
$user = Session::user();             // array|null
if (Session::isLoggedIn()) { /* ... */ }

$user     = auth();          // Session::user()
$userId   = auth_id();       // Session::user()['id'] ?? null
$loggedIn = is_logged_in();  // Session::isLoggedIn()
```

### Session Configuration

```php
// config/session.php
return [
    'name'      => 'litephp_session',
    'lifetime'  => 120,       // minutes idle timeout
    'domain'    => null,      // null = current domain
    'samesite'  => 'Lax',     // 'Strict', 'Lax', or 'None'
    'secure'    => false,     // true in production (HTTPS)
];
```

> **Note:** `lifetime` is in minutes — LitePHP tracks last activity and resets `$_SESSION` if idle time elapsed, even if the cookie hasn't expired.

### CSRF Protection

```php
<form method="POST" action="/posts">
    <?= csrf_field() ?>
</form>
```

```php
$token = csrf_token(); // raw token for AJAX
```

`VerifyCsrfToken` accepts both current and previous token within a 30-second grace window — avoids false 419s with multiple tabs open.

### Security Reference

> **Warning:** Always call `Session::regenerate()` (or `Session::setUser()`, which calls it internally) after login — otherwise vulnerable to session fixation.

> **Warning:** Set `'secure' => true` in production over HTTPS.

> **Tip:** `'samesite' => 'Strict'` gives the strongest cookie-level CSRF protection for apps that don't need cross-site session sharing; use `'Lax'` if sessions must persist through top-level navigation from external links.
