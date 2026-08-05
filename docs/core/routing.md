---
title: Routing
description: "Learn how to register routes, group them with shared prefixes and middleware, name them for easy URL generation, and cache them for production performance in LitePHP."
---

# Routing

> Learn how to register routes, group them with shared prefixes and middleware, name them for easy URL generation, and cache them for production performance in LitePHP.

LitePHP's router maps HTTP requests to handler code. You register routes via the `Route` facade in your route files; the framework matches incoming requests, resolves dependencies, and dispatches to the right handler.

### Basic Route Registration

```php
use Core\Facades\Route;
use App\Controllers\PostController;

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::put('/posts/{id}', [PostController::class, 'update']);
Route::patch('/posts/{id}', [PostController::class, 'update']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);
```

```php
use Core\Facades\Route;

Route::get('/hello', function () {
    return response()->json(['message' => 'Hello, world!']);
});

Route::post('/echo', function () {
    $body = request()->all();
    return response()->json($body);
});
```

> **Note:** Place web routes in `routes/web.php` and API routes in `routes/api.php`. LitePHP loads both during bootstrapping — the separation is purely organisational.

### Route Parameters

Add `{paramName}` segments to a URI pattern. The recommended approach is to declare typed scalar parameters directly in the method signature — the router casts each value to `int`, `float`, or `bool` automatically:

```php
// routes/api.php
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::get('/users/{userId}/posts/{postId}', [PostController::class, 'userPost']);
```

```php
// Preferred: typed parameters — router casts and injects them in order
public function show(Request $request, int $id) { /* ... */ }
public function userPost(Request $request, int $userId, int $postId) { /* ... */ }
```

At runtime (e.g. inside a service or middleware) use `$request->params()` (all route params, ordered array) or `$request->param(int $index)` (single positional value).

> **Tip:** Prefer typed scalar parameters in method signatures over `$request->param()` — they're auto-cast, self-documenting, and work cleanly with dependency injection.

### Closure vs Controller

Closures are convenient for quick, one-off responses and prototyping, but **closure routes cannot be cached**. Controller actions keep route files clean, are fully cacheable, and integrate with dependency injection. Prefer controller actions for anything deployed to production.

### Route Groups

`Route::group(string $prefix, array|string $middleware, callable $callback)` — prefix first, then middleware, then the callback:

```php
use Core\Facades\Route;
use App\Controllers\UserController;
use App\Controllers\ProfileController;

Route::group('/api/v1', ['auth:api'], function () {
    Route::get('/users',          [UserController::class, 'index']);
    Route::post('/users',         [UserController::class, 'store']);
    Route::get('/users/{id}',     [UserController::class, 'show']);
    Route::put('/users/{id}',     [UserController::class, 'update']);
    Route::delete('/users/{id}',  [UserController::class, 'destroy']);

    Route::get('/profile', [ProfileController::class, 'show']);
});
```

Groups nest cleanly — the router concatenates prefixes and merges middleware so inner groups inherit from parents:

```php
Route::group('/admin', ['auth', 'role:admin'], function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Nested group — effective prefix: /admin/settings
    // Effective middleware: auth, role:admin, verified
    Route::group('/settings', ['verified'], function () {
        Route::get('/',    [SettingsController::class, 'index']);
        Route::post('/',   [SettingsController::class, 'update']);
    });
});
```

> **Note:** Always pass the middleware array as the **second** argument and the callback as the **third**. Swapping these causes a runtime error. Apply middleware at the group level whenever multiple routes share access rules.

### Named Routes

```php
Route::get('/posts',       [PostController::class, 'index'])->name('posts.index');
Route::get('/posts/{id}',  [PostController::class, 'show'])->name('posts.show');
Route::post('/posts',      [PostController::class, 'store'])->name('posts.store');
Route::delete('/posts/{id}', [PostController::class, 'destroy'])->name('posts.destroy');
```

```php
$indexUrl = route('posts.index');                 // "/posts"
$showUrl  = route('posts.show', ['id' => 42]);     // "/posts/42"
return $this->redirectRoute('posts.index');        // inside a controller
```

You can chain both `.name()` and `.middleware()` inside a group. Names passed to `->name()` are the full name — LitePHP does not auto-prefix.

### Method Spoofing

HTML forms only support `GET`/`POST`. Add a hidden `_method` field to send `PUT`/`PATCH`/`DELETE`:

```html
<form action="/posts/{{ $post->id }}" method="POST">
    @csrf
    @method('PUT')
    <input type="text" name="title" value="{{ $post->title }}">
    <button type="submit">Update Post</button>
</form>
```

```html
<form action="/posts/42" method="POST">
    <input type="hidden" name="_method" value="DELETE">
    <button type="submit">Delete Post</button>
</form>
```

`Request::method()` checks the `_method` POST field first.

### Fallback Route

```php
// routes/web.php — must be the last entry
Route::fallback(function () {
    return response()->json(['error' => 'Not Found'], 404);
});

// or, for a web app:
Route::fallback(function () {
    return response()->view('errors.404');
});
```

### Route Caching

```bash
php lite route:cache
```

Serialises every registered route (path, method, controller action, middleware) into `bootstrap/cache/routes.php`. Commit/copy this file to production. After any route change:

```bash
php lite route:clear
php lite route:cache
```

> **Warning:** Closure routes cannot be cached — `route:cache` throws a `RuntimeException` if any registered route uses a closure. Convert to controller actions first.

> **Tip:** Run `php lite route:cache` as part of your CI/CD pipeline, after routes are deployed but before the web server starts handling traffic.

### Best Practices

- **Separate web and API routes** — `routes/web.php` for browser-facing/session-based routes, `routes/api.php` for stateless JSON. Apply `VerifyCsrfToken` to `web`, auth/rate-limiting to `api`.
- **Always name your routes** — `->name('resource.action')` on every route.
- **Group, don't repeat middleware** — apply shared middleware once at the group level.
- **Cache routes in production** — `php lite route:cache` on every deploy (requires controller-based actions only).
