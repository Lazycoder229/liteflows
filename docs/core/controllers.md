---
title: Controllers
description: "Learn how to create controllers, use base controller helpers, inject dependencies, validate with FormRequests, and return views, JSON, and redirects in LitePHP."
---

# Controllers

> Learn how to create controllers, use base controller helpers, inject dependencies, validate with FormRequests, and return views, JSON, and redirects in LitePHP.

Controllers are PHP classes that receive an HTTP request, coordinate application logic, and return a response. Every controller extends `Core\Controller`, which provides helpers for rendering views, sending JSON, redirecting, and aborting with error codes.

### Creating a Controller

```bash
php lite make:controller PostController
php lite make:controller PostController --resource   # pre-populated w/ 5 RESTful stubs
```

```php
<?php
namespace App\Controllers;

use Core\Controller;
use Core\Http\Request;

class PostController extends Controller
{
    public function index(Request $request) { /* List all posts */ }
    public function show(Request $request, int $id) { /* Show a single post */ }
    public function store(Request $request) { /* Create a new post */ }
    public function update(Request $request, int $id) { /* Update an existing post */ }
    public function destroy(Request $request, int $id) { /* Delete a post */ }
}
```

```php
use Core\Facades\Route;
use App\Controllers\PostController;

Route::get('/posts',          [PostController::class, 'index'])->name('posts.index');
Route::get('/posts/{id}',     [PostController::class, 'show'])->name('posts.show');
Route::post('/posts',         [PostController::class, 'store'])->name('posts.store');
Route::put('/posts/{id}',     [PostController::class, 'update'])->name('posts.update');
Route::delete('/posts/{id}',  [PostController::class, 'destroy'])->name('posts.destroy');
```

### Base Controller Methods

| Method | Description |
|---|---|
| `$this->view()` | Renders a `.lites` template as HTML. Flash error and old-input data auto-injected. |
| `$this->json()` | Encodes an array as JSON, sends with a status code (default `200`). |
| `$this->redirect()` | Issues a `302` redirect to a URL string. |
| `$this->redirectRoute()` | Resolves a named route URL (substituting params) and redirects. |
| `$this->back()` | Redirects to the previous page — validated same-host Referer check; falls back to `/`. |
| `$this->request()` | Returns the current `Request` instance from the container. |
| `$this->validate()` | Validates current request data. Redirects back with flashed errors on failure; returns validated data on success. |
| `$this->route()` | Generates the URL string for a named route. |
| `$this->abort()` | Sends an error HTTP status, renders the matching error view from `app/Views/errors/`, terminates. |

Quick reference:

```php
return $this->view('posts.index', ['posts' => $posts]);
return $this->json(['post' => $post->toArray()], 201);
return $this->redirect('/dashboard');
return $this->redirectRoute('posts.show', ['id' => $post->id]);
return $this->back();
$request = $this->request();
$data = $this->validate(['title' => 'required|min:3|max:255']);
$url = $this->route('posts.show', ['id' => 42]);
$this->abort(404, 'Post not found');
```

### Dependency Injection

Type-hint any service class/interface in a controller constructor for auto-resolution. Route parameters are injected positionally after class-typed parameters:

```php
<?php
namespace App\Controllers;

use Core\Controller;
use Core\Http\Request;
use App\Services\PostService;

class PostController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function index(Request $request)
    {
        $page  = $request->query('page', 1);
        $posts = $this->postService->getPaginated((int) $page);
        return $this->view('posts.index', compact('posts'));
    }

    public function show(Request $request, int $id)
    {
        $post = $this->postService->findOrFail($id);
        return $this->json(['post' => $post->toArray()]);
    }
}
```

### The Service Layer Pattern

Flow: `HTTP Request → Controller → Service → Model → Database`. Controller validates and delegates; Service holds business logic (no HTTP knowledge); Model handles persistence.

```bash
php lite make:service PostService --resource
```

Generates `app/Services/PostService.php` with placeholder methods (`all`, `find`, `create`, `update`, `delete`).

Complete end-to-end example (Model → Service → Controller → Routes):

```php
// app/Models/Post.php
namespace App\Models;
use Core\Database\Model;

class Post extends Model
{
    protected string $table = 'posts';
    protected array $fillable = ['title', 'slug', 'body', 'status', 'user_id'];
}
```

```php
// app/Services/PostService.php
namespace App\Services;
use App\Models\Post;

class PostService
{
    public function all(): array { return Post::all(); }

    public function findOrFail(int $id): Post
    {
        $post = Post::find($id);
        if (!$post) abort(404, 'Post not found');
        return $post;
    }

    public function create(array $data): Post
    {
        $data['slug'] = $this->generateSlug($data['title']);
        return Post::create($data);
    }

    public function update(int $id, array $data): Post
    {
        $post = $this->findOrFail($id);
        $post->fill($data)->save();
        return $post;
    }

    public function delete(int $id): void { $this->findOrFail($id)->delete(); }

    private function generateSlug(string $title): string
    {
        return strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $title), '-'));
    }
}
```

```php
// app/Controllers/PostController.php
namespace App\Controllers;
use Core\Controller;
use Core\Http\Request;
use Core\Http\JsonResponse;
use App\Services\PostService;

class PostController extends Controller
{
    public function __construct(private PostService $postService) {}

    public function index(Request $request)
    {
        return JsonResponse::success($this->postService->all());
    }

    public function show(Request $request, int $id)
    {
        return JsonResponse::success($this->postService->findOrFail($id)->toArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'  => 'required|min:3|max:255',
            'body'   => 'required|min:10',
            'status' => 'required|in:draft,published',
        ]);
        return JsonResponse::created($this->postService->create($data)->toArray());
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'title'  => 'required|min:3|max:255',
            'body'   => 'required|min:10',
            'status' => 'required|in:draft,published',
        ]);
        $post = $this->postService->update($id, $data);
        return JsonResponse::success($post->toArray(), 'Post updated');
    }

    public function destroy(Request $request, int $id)
    {
        $this->postService->delete($id);
        return JsonResponse::noContent();
    }
}
```

```php
// routes/api.php
use Core\Facades\Route;
use App\Controllers\PostController;

Route::group('/api/v1', ['auth:api'], function () {
    Route::get('/posts',         [PostController::class, 'index'])->name('api.posts.index');
    Route::get('/posts/{id}',    [PostController::class, 'show'])->name('api.posts.show');
    Route::post('/posts',        [PostController::class, 'store'])->name('api.posts.store');
    Route::put('/posts/{id}',    [PostController::class, 'update'])->name('api.posts.update');
    Route::delete('/posts/{id}', [PostController::class, 'destroy'])->name('api.posts.destroy');
});
```

> **Tip:** Keep controllers thin. If a method exceeds ~20 lines, move logic into a service, repository, or action class.

### FormRequest for Validation

Type-hint a `FormRequest` subclass instead of `Request`. LitePHP resolves it, runs `authorize()` and `rules()` **before** the controller method is called.

```bash
php lite make:request StorePostRequest
```

```php
<?php
namespace App\Requests;
use Core\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool { return auth()->check(); }

    public function rules(): array
    {
        return [
            'title'   => 'required|min:3|max:255',
            'body'    => 'required|min:10',
            'status'  => 'required|in:draft,published',
            'tags'    => 'nullable|array',
        ];
    }
}
```

```php
use App\Requests\StorePostRequest;

public function store(StorePostRequest $request)
{
    $post = $this->postService->create($request->validated());
    return $this->json(['post' => $post->toArray()], 201);
}
```

If `authorize()` returns `false`, LitePHP throws `ForbiddenException` (403). On validation failure: redirect with flashed errors (web) or `422` JSON (API) — the controller method is never entered.

### Returning Responses

```php
return $this->view('posts.index', ['posts' => $posts]);
return $this->json(['users' => $users]);
return $this->json(['post' => $post->toArray()], 201);
return $this->redirect('/posts');
return $this->redirectRoute('posts.show', ['id' => $post->id]);
return $this->back();
```

For APIs, use `JsonResponse` static factories:

```php
use Core\Http\JsonResponse;

return JsonResponse::success($post->toArray());
return JsonResponse::created($post->toArray());
return JsonResponse::notFound('Post not found');
return JsonResponse::validationError($errors);
return JsonResponse::noContent();
```

### Best Practices

- **One responsibility per controller** — business logic belongs in a Service (Controller → Service → Model).
- **Use FormRequest for validation** — keeps action methods on the happy path, reusable rules.
- **Use JsonResponse factories** — consistent API response structure.
- **Never echo output** — always return a response value; direct `echo` bypasses headers/caching/lifecycle.
