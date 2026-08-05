---
title: Global Helpers
description: "A complete reference for every global helper function LitePHP provides — paths, URLs, requests, sessions, auth, cache, events, strings, and more."
---

# Global Helpers

> A complete reference for every global helper function LitePHP provides — paths, URLs, requests, sessions, auth, cache, events, strings, and more.

60+ global helper functions callable anywhere — controllers, views, middleware, console commands — no imports needed.

### Application & Container

```php
app()                         // Container instance
app(MyService::class)         // Resolve MyService from the container
```

### Path Helpers

```php
base_path()                    // /var/www/myapp
base_path('config')            // /var/www/myapp/config
app_path()                     // /var/www/myapp/app
app_path('Controllers')        // /var/www/myapp/app/Controllers
public_path()                  // /var/www/myapp/public
public_path('images/logo.png') // /var/www/myapp/public/images/logo.png
storage_path()                 // /var/www/myapp/storage
storage_path('logs')           // /var/www/myapp/storage/logs
uploads_path()                 // /var/www/myapp/storage/uploads
uploads_path('avatars')        // /var/www/myapp/storage/uploads/avatars
log_path()                     // /var/www/myapp/storage/logs
log_path('errors.log')         // /var/www/myapp/storage/logs/errors.log
cache_path()                   // /var/www/myapp/storage/cache
view_path('posts.index')       // /var/www/myapp/app/views/posts/index.php
```

### Configuration & Environment

```php
config('app.name')
config('db.host', '127.0.0.1')
config('mail.from.address')

env('APP_KEY')
env('APP_DEBUG', false)
```

### URL & Routing

```php
url('/posts/1')                     // https://yourapp.com/posts/1
url('/users', [42])                 // https://yourapp.com/users/42
asset('css/app.css')                // https://yourapp.com/assets/css/app.css
current_url()                       // https://yourapp.com/posts/1?page=2
current_path()                      // /posts/1
is_active('/posts')                 // 'active' if current path matches, '' otherwise
is_active('/posts', 'nav--current') // custom class name
route('posts.show', ['id' => 1])
route('users.index')
```

### Request

```php
request()             // current Request instance
request('name')       // shorthand for request()->input('name')
request('page', 1)    // with default

query('page', 1)      // read from query string
query('sort')
```

### Response

```php
response()
view('posts.index', $data)
view('auth.login')
redirect('/dashboard')       // 302
redirect('/login', 301)      // 301
back()                        // redirect to previous URL
abort(404)
abort(403, 'Forbidden')
abort(500, 'Server error')
```

### Authentication

```php
auth()             // current user array, or null
auth()['name']
auth_id()          // current user's ID, or null
auth_user()        // alias for auth()
is_logged_in()
```

### Session

```php
session('key')                // read
session('key', 'default')

// direct calls preferred for writes:
\Core\Session::set('cart', $items);
\Core\Session::get('cart');
```

### Flash Messages

```php
flash('success', 'Post saved!')
flash('error', 'Something went wrong.')
flash('success')   // read (and consume)
flash('error')

old('email')
old('name', 'Guest')
```

### CSRF

```php
csrf_token()   // raw token string
csrf_field()   // full hidden <input> element
```

### Cache

```php
cache('key')
cache('key', 'default')

\Core\Cache\Cache::put('key', $value, 3600);
\Core\Cache\Cache::remember('user:1', 3600, function () { return User::find(1); });
\Core\Cache\Cache::forget('user:1');
```

### Events

```php
event('user.registered', ['user' => $user]);
event('order.completed', ['order' => $order, 'total' => 49.99]);

listen('user.registered', function (array $payload) {
    $mailer->sendWelcomeEmail($payload['user']);
});
```

### Collections & Arrays

```php
collect([1, 2, 3])
collect($posts)

data_get($config, 'database.host')
data_get($user, 'address.city', 'Unknown')
```

### String Helpers

```php
e('<script>alert(1)</script>')   // '&lt;script&gt;alert(1)&lt;/script&gt;' — HTML-encode

str_limit($text, 100)            // truncate + '...'
str_limit($text, 80, ' [read more]')

str_slug('Hello World!')         // 'hello-world'
str_slug('Héllo Wörld', '_')     // 'hello_world'

str_uuid()                       // '550e8400-e29b-41d4-a716-446655440000'
str_random(32)
str_random(16)

litstr()                         // Str instance for method chaining
```

### Hashing

```php
bcrypt('my-password')   // equivalent to Hash::make()
```

### Debugging

```php
dump($variable)
dump($a, $b, $c)
dd($variable)   // dump and die
```

> **Warning:** `dump()`/`dd()` are silenced when `APP_DEBUG=false` — a forgotten `dd()` in production terminates silently rather than leaking internal data.

### Logging

```php
log_message('INFO',     'User registered',      ['id' => $user->id]);
log_message('WARNING',  'Slow query detected',  ['ms' => 430]);
log_message('ERROR',    'Payment failed',        ['order' => $orderId]);
log_message('DEBUG',    'Cache miss',            ['key' => 'user:1']);
log_message('CRITICAL', 'Database unreachable',  []);
```

Written to `storage/logs/app-YYYY-MM-DD.log` and `storage/logs/app.log`; echoed to stderr with ANSI colours in development.

### Authorization

```php
gate()
gate()->allows('edit-post', $post)
gate()->denies('delete-user', $targetUser)
```

### Mail

```php
mail_send($mailable)
```

### JWT

```php
jwt_issue(['user_id' => 1, 'role' => 'admin'], 3600)
jwt_verify($tokenString)   // claims array or null on failure
```

### View Utilities

```php
errors()                    // all validation errors
errors('email')             // first error message for 'email', or null
hasError('email')
hasError('password')

navLink('/posts', 'Posts')
navLink('/about', 'About', 'nav-active', 'nav-inactive')

vite('resources/js/app.js')
vite(['resources/js/app.js', 'resources/css/app.css'])

paginate($items, $total, $perPage, $currentPage)
```
