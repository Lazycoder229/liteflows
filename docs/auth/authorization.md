---
title: Authorization (Gate)
description: "Define fine-grained abilities and role groups, then check or enforce them in controllers, services, and views using LitePHP's Gate facade."
---

# Authorization (Gate)

> Define fine-grained abilities and role groups, then check or enforce them in controllers, services, and views using LitePHP's Gate facade.

`Gate` separates authentication (who you are) from authorization (what you're allowed to do). Named abilities are closures, optionally grouped into roles. Denied calls return `false` or throw `ForbiddenException` — your choice.

### Defining Abilities

```php
// app/Providers/AuthServiceProvider.php
use Core\Auth\Gate;

class AuthServiceProvider
{
    public function boot(): void
    {
        Gate::define('edit-post', function (array $user, $post): bool {
            return (int) $user['id'] === (int) $post->user_id;
        });

        Gate::define('delete-post', function (array $user, $post): bool {
            return (int) $user['id'] === (int) $post->user_id || $user['role'] === 'admin';
        });

        Gate::define('publish-post', function (array $user, $post): bool {
            return in_array($user['role'], ['editor', 'admin'], true);
        });

        Gate::define('manage-users', function (array $user): bool {
            return $user['role'] === 'admin';
        });
    }
}
```

> **Tip:** Keep ability names hyphenated, verb-noun (`edit-post`, `delete-comment`) — readable in failure messages and middleware config.

### Defining Roles

```php
Gate::role('editor', ['create-post', 'edit-post', 'publish-post']);

Gate::role('admin', [
    'create-post', 'edit-post', 'delete-post',
    'publish-post', 'manage-users', 'view-reports',
]);
```

A user with `role = 'admin'` automatically passes any `Gate::allows('delete-post')` check without repeating logic in the callback.

> **Note:** Role membership compares `$user['role']` against the name passed to `Gate::role()`. If roles live in a separate table or as a comma-separated list, register a custom `userResolver` to normalise the value.

### Checking Authorization

```php
// allows() / denies() — branch, don't throw
use Core\Auth\Gate;

if (Gate::allows('edit-post', $post)) { /* show edit button */ }
if (Gate::denies('delete-post', $post)) {
    return JsonResponse::forbidden('You cannot delete this post.');
}
if (Gate::hasRole('admin')) { /* render admin panel link */ }
```

```php
// authorize() — throws ForbiddenException (403) on denial
use Core\Auth\Gate;

Gate::authorize('edit-post', $post);
$post->update($request->only(['title', 'body'])); // only reached if allowed
```

### Using Gate in Controllers

```php
use Core\Auth\Gate;
use Core\Http\JsonResponse;
use Core\Http\Request;
use App\Models\Post;

class PostController extends Controller
{
    public function update(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        Gate::authorize('edit-post', $post);
        $post->update($request->only(['title', 'body']));
        return JsonResponse::success($post->toArray());
    }

    public function destroy(int $id)
    {
        $post = Post::findOrFail($id);
        Gate::authorize('delete-post', $post);
        $post->delete();
        return JsonResponse::success(['message' => 'Post deleted.']);
    }
}
```

### Authorising in the Service Layer

Put the check in the service, not the controller — enforced regardless of entry point:

```php
// app/Services/PostService.php
use Core\Auth\Gate;
use App\Models\Post;

class PostService
{
    public function update(int $id, array $data): Post
    {
        $post = Post::findOrFail($id);
        Gate::authorize('edit-post', $post);
        $post->update($data);
        return $post->fresh();
    }

    public function delete(int $id): void
    {
        $post = Post::findOrFail($id);
        Gate::authorize('delete-post', $post);
        $post->delete();
    }
}
```

```php
class PostController extends Controller
{
    public function __construct(private PostService $posts) {}

    public function destroy(int $id)
    {
        $this->posts->delete($id); // authorization happens inside
        return JsonResponse::success(['message' => 'Deleted.']);
    }
}
```

### Role Middleware

```php
// app/Middleware/RoleMiddleware.php
namespace App\Middleware;
use Core\Auth\Gate;
use Core\Http\JsonResponse;
use Core\Middleware\Middleware;
use Core\Middleware\Attributes\RegisterMiddleware;

#[RegisterMiddleware(group: 'web', alias: 'role')]
class RoleMiddleware implements Middleware
{
    public function handle($request, $response, callable $next): mixed
    {
        $role = $request->getRouteParam('middleware_param') ?? 'admin'; // e.g. 'role:admin'
        if (!Gate::hasRole($role)) return JsonResponse::forbidden("Role [{$role}] required.");
        return $next($request, $response);
    }
}
```

```php
// routes/web.php
Route::group('/admin', function () {
    Route::get('/', [AdminController::class, 'index']);
    Route::get('/users', [UserController::class, 'index']);
}, ['auth', 'role:admin']);
```

### Checking Auth and Abilities in Views

```html
@if(auth()->check())
    <p>Welcome, <?= htmlspecialchars(auth_user()['name']) ?></p>
    <a href="/logout">Logout</a>
@endif

@if(gate()->allows('edit-post', $post))
    <a href="/posts/<?= $post->id ?>/edit" class="btn">Edit</a>
@endif

@if(gate()->allows('delete-post', $post))
    <form method="POST" action="/posts/<?= $post->id ?>">
        <input type="hidden" name="_method" value="DELETE">
        <button class="btn btn-danger">Delete</button>
    </form>
@endif

@if(gate()->hasRole('admin'))
    <a href="/admin">Admin Panel</a>
@endif
```

### Custom User Resolver

Default: `Gate` reads the user from `Auth::user()` (session). For JWT/token-guarded APIs without a session:

```php
// bootstrap/app.php
use Core\Auth\Gate;
use App\Models\User;

Gate::userResolver(function (): ?array {
    $userId = request()->getRouteParam('auth_user_id');
    if (!$userId) return null;
    return User::find($userId)?->toArray();
});
```

### Best Practices

- **Define abilities in one place** — a dedicated `AuthServiceProvider::boot()` keeps authorization logic auditable.
- **Put `Gate::authorize()` in services, not controllers** — enforced regardless of entry point (web, API, queued jobs).
- **Prefer `Gate::authorize()` over `allows()` + manual abort** — consistent `ForbiddenException` handled uniformly by the global error handler.
