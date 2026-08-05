---
title: Response
description: "Learn how to send HTML views, JSON, redirects, file downloads, and paginated API responses using LitePHP's Response object and JsonResponse static factories."
---

# Response

> Learn how to send HTML views, JSON, redirects, file downloads, and paginated API responses using LitePHP's Response object and JsonResponse static factories.

Responses are built through a `Core\Http\Response` instance that accumulates status, headers, and body before flushing — no output before headers are set. Access it via `response()`, `$this->json()`/`$this->view()` in a controller, or `JsonResponse` static factories.

### HTML / View Responses

```php
return response()->view('posts.index', ['posts' => $posts]);
return $this->view('posts.index', ['posts' => $posts]);
return $this->view('posts.show', ['post' => $post, 'comments' => $comments, 'author' => $author]);
```

`posts.index` (dot notation) resolves to `app/Views/posts/index.lites`.

> **Note:** `response()->view()` always sends `200 OK`. For an error view with a specific status use `response()->setStatusCode(404)` before `view()`, or `$this->abort(404)`.

### JSON Responses

```php
return response()->json(['message' => 'Created'], 201);
return $this->json(['users' => $users]);          // default 200
return $this->json(['post' => $post->toArray()], 201);
return $this->json(['error' => 'Not found'], 404);
```

### JsonResponse Static Factories

```php
use Core\Http\JsonResponse;

// Success
return JsonResponse::success($data);                                  // 200
return JsonResponse::success($data, 'Post retrieved successfully');   // 200, custom message
return JsonResponse::created($post->toArray());                       // 201
return JsonResponse::created($post->toArray(), 'Post published');     // 201, custom message
return JsonResponse::noContent();                                      // 204

// Errors
return JsonResponse::error('Something went wrong', 500);
return JsonResponse::error('Batch failed', 400, ['item_3' => 'duplicate key']);
return JsonResponse::notFound('Post not found');                       // 404
return JsonResponse::unauthorized('Please log in to continue');        // 401
return JsonResponse::forbidden('You do not have access to this resource'); // 403
return JsonResponse::validationError($errors);                         // 422
return JsonResponse::validationError($errors, 'Please correct the highlighted fields');
```

Method reference:

| Method | Status | Signature |
|---|---|---|
| `success` | 200 | `success(mixed $data = null, string $message = 'Success', int $status = 200): never` |
| `created` | 201 | `created(mixed $data = null, string $message = 'Created'): never` |
| `noContent` | 204 | `noContent(): never` |
| `error` | any | `error(string $message = 'Error', int $status = 400, mixed $errors = null): never` |
| `notFound` | 404 | `notFound(string $message = 'Not Found'): never` |
| `unauthorized` | 401 | `unauthorized(string $message = 'Unauthorized'): never` |
| `forbidden` | 403 | `forbidden(string $message = 'Forbidden'): never` |
| `validationError` | 422 | `validationError(array $errors, string $message = 'Validation failed'): never` |
| `paginated` | 200 | `paginated(array $data, array $meta): never` |

Envelope shapes:

```json
{ "success": true, "message": "Success", "data": { "id": 42, "title": "Hello World", "status": "published" } }
```

```json
{ "success": false, "message": "Validation failed", "errors": { "title": ["The title field is required."], "body": ["The body must be at least 10 characters."] } }
```

### Redirects

```php
return response()->redirect('/dashboard');
return response()->back();                 // same-host validated
return response()->back('/home');          // with fallback
return $this->redirectRoute('posts.index');
return $this->redirectRoute('posts.show', ['id' => $post->id]);
return $this->redirect('/settings');
return $this->back();
```

> **Warning:** `response()->back()` validates `HTTP_REFERER` against the current host before trusting it — never redirect to `$_SERVER['HTTP_REFERER']` directly.

### HTML Responses

```php
return response()->html('<h1>Hello</h1>', 200);
return response()->html('<p>Maintenance in progress.</p>', 503);
```

### File Downloads

```php
return response()->download(
    storage_path('reports/annual-2024.pdf'),
    'Annual Report 2024.pdf'
);
```

Only serves files inside `storage/`; the filename is sanitised with `addslashes(basename())` before being written into `Content-Disposition`.

> **Warning:** Never pass user-supplied path strings directly to `download()` — build paths with `storage_path()`. Serving outside `storage/` throws a `RuntimeException`.

### Abort with HTTP Status

```php
abort(404, 'Post not found');
abort(403, 'You are not allowed to do that');
abort(400, 'Bad Request');
abort(500);  // defaults to "Internal Server Error"

$this->abort(404, 'Post not found'); // inside a controller
```

### Custom Headers and Status Codes

```php
return response()
    ->withHeader('X-Request-Id', $requestId)
    ->withHeaders(['Cache-Control' => 'no-store', 'X-Frame-Options' => 'DENY'])
    ->html('<p>OK</p>', 200);
```

| Method | Signature | Description |
|---|---|---|
| `setStatusCode` | `setStatusCode(int $code): static` | Set HTTP status |
| `status` | `status(): int` | Get current status code |
| `withHeader` | `withHeader(string $key, string $value): static` | Add one header |
| `withHeaders` | `withHeaders(array $headers): static` | Add multiple headers |
| `setContent` | `setContent(string $content): static` | Set raw body |
| `getContent` | `getContent(): string` | Read current body |
| `send` | `send(): never` | Flush status/headers/body — terminates script |

### Pagination Responses

```php
use Core\Http\JsonResponse;
use Core\Http\Paginator;

public function index(Request $request)
{
    $page      = (int) $request->query('page', 1);
    $paginator = Post::query()->paginate(15, $page);
    return JsonResponse::paginated($paginator->items(), $paginator->toArray());
}
```

```json
{
    "success": true,
    "data": [ { "id": 1, "title": "First Post", "status": "published" }, { "id": 2, "title": "Second Post", "status": "draft" } ],
    "meta": { "total": 48, "per_page": 15, "current_page": 1, "last_page": 4, "from": 1, "to": 15, "has_more": true }
}
```

> **Tip:** For server-rendered HTML pagination, call `$paginator->links()` in a `.lites` template — renders Bootstrap-compatible `<nav>` markup, no JS required.

### No-Content Response

```php
return JsonResponse::noContent();
return response()->noContent();
```

### Best Practices

- **Use `JsonResponse` factories** — never construct raw response arrays by hand.
- **Never echo output** — always return a response value.
- **Abort for unrecoverable errors** — `$this->abort(404)` / `abort()` renders a proper error view with the correct status.
- **Validate downloads** — build paths with `storage_path()`, never pass user input directly.
