---
title: Request
description: "Learn how to read input, query strings, JSON bodies, headers, route parameters, uploaded files, and how to validate data inline or with FormRequest classes in LitePHP."
---

# Request

> Learn how to read input, query strings, JSON bodies, headers, route parameters, uploaded files, and how to validate data inline or with FormRequest classes in LitePHP.

Every incoming HTTP request is wrapped in a `Core\Http\Request` instance, injected into controller methods and available globally via `request()`. It normalises `$_GET`, `$_POST`, `php://input`, `$_FILES`, and `$_SERVER` into one consistent API.

### Accessing Input

`$request->input()` reads from merged GET + POST + JSON body, in that priority order:

```php
$title   = $request->input('title');               // null if missing
$status  = $request->input('status', 'draft');      // with default
$all     = $request->all();                          // everything
$subset  = $request->only(['title', 'body', 'status']);
$safe    = $request->except(['password', 'password_confirmation']);
if ($request->has('email')) { /* ... */ }
```

### Query Parameters

```php
// ?page=3&per_page=15
$page     = $request->query('page', 1);
$perPage  = $request->query('per_page', 15);
$allQuery = $request->query();
```

### JSON Body

Automatically parsed when `Content-Type: application/json`. Values are included in `$request->all()`/`input()` too:

```php
$name  = $request->json('name');
$email = $request->json('email', 'fallback@example.com');
$body  = $request->json();
if ($request->isJson()) { /* handle API request */ }
```

> **Note:** `$request->all()` merges `$_GET`, `$_POST`, and the JSON body in that order — JSON values overwrite identically-named POST/GET values.

### Route Parameters

```php
// Route: GET /posts/{id}
public function show(Request $request, int $id) { /* $id already an int */ }

// Route: GET /users/{userId}/posts/{postId}
public function userPost(Request $request, int $userId, int $postId) { /* both cast to int */ }
```

At runtime: `$request->params()` (ordered array) or `$request->param(int $index)` (positional).

### Method and Path

```php
$method = $request->method();   // GET, POST, PUT, etc. (handles method spoofing)
$path   = $request->path();     // "/posts/42"
$url    = $request->url();      // "https://example.com/posts/42"
if ($request->isAjax()) { /* ... */ }
if ($request->isJson()) { /* ... */ }
```

### Headers

```php
$accept        = $request->header('Accept');
$contentType   = $request->header('Content-Type');
$authorization = $request->header('Authorization');
$token         = $request->bearerToken();   // Bearer token shorthand
```

### IP Address

```php
$clientIp = $request->ip();   // "203.0.113.42"
```

Reads `X-Forwarded-For`/`X-Client-IP` (validated) only if the request comes through a trusted proxy configured in `app.trusted_proxies`; otherwise returns `REMOTE_ADDR`.

### File Uploads

```php
$file = $request->file('avatar');

if ($request->hasFile('avatar') && $file->isValid()) {
    if ($file->maxSize(2 * 1024 * 1024) && $file->mimeIn(['image/jpeg', 'image/png', 'image/webp'])) {
        $path = $file->store('uploads/avatars');                  // random filename
        $path = $file->storeAs('uploads/avatars', 'profile.jpg'); // explicit filename
    }
}
```

`UploadedFile` methods:

| Method | Returns | Description |
|---|---|---|
| `isValid()` | `bool` | `true` if upload completed without errors |
| `getMimeType()` | `string` | Real MIME type from file magic bytes (`finfo`) |
| `getOriginalName()` | `string` | Client-supplied filename (not trusted for paths) |
| `getSize()` | `int` | Size in bytes |
| `getExtension()` | `string` | Derived from real MIME, never client filename |
| `getError()` | `int` | Raw PHP upload error code |
| `maxSize(int $bytes)` | `bool` | `true` if at/below limit |
| `mimeIn(array $mimes)` | `bool` | `true` if real MIME is in the allowed list |
| `store(string $dir)` | `string` | Moves to `storage/uploads/{dir}/` with random name |
| `storeAs(string $dir, string $name)` | `string` | Moves to `storage/uploads/{dir}/{name}` |

> **Warning:** MIME type is read from magic bytes via `finfo` — never from `$_FILES['type']` (attacker-controlled). Always use `$file->mimeIn()`.

### Inline Validation

```php
$data = $request->validate([
    'title'  => 'required|min:3|max:255',
    'body'   => 'required|min:10',
    'status' => 'required|in:draft,published',
    'email'  => 'required|email',
    'age'    => 'required|integer|min:18',
]);
```

Common rule tokens: `required`, `min:N`, `max:N`, `email`, `integer`, `in:a,b,c`, `nullable`, `array`.

### FormRequest

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
            'title'  => 'required|min:3|max:255',
            'body'   => 'required|min:10',
            'status' => 'required|in:draft,published',
            'tags'   => 'nullable|array',
        ];
    }
}
```

```php
use App\Requests\StorePostRequest;

public function store(Request $request)
{
    $formRequest = app(StorePostRequest::class);
    $data        = $formRequest->validateForm(); // runs authorize() then validate()
    $post = $this->postService->create($data);
    return $this->json(['post' => $post->toArray()], 201);
}
```

FormRequest API:

| Method | Signature | Description |
|---|---|---|
| `authorize()` | `public function authorize(): bool` | Defaults `true`. Return `false` → `ForbiddenException` (403). |
| `rules()` | `abstract public function rules(): array` | Must implement. |
| `validateForm()` | `public function validateForm(): array` | Runs `authorize()` then `validate($this->rules())`. |
| `validated()` | `public function validated(): array` | Only rule-declared fields, after successful `validateForm()`. |

### CSRF Protection

Handled automatically for state-changing web routes:

```html
<form action="/posts" method="POST">
    @csrf
    <input type="text" name="title">
    <button type="submit">Create</button>
</form>
```

### Safe Redirect Back

```php
$backUrl = $request->safeRedirectBack('/dashboard'); // validates Referer host
return $this->redirect($backUrl);
```

> **Warning:** Never redirect to `$_SERVER['HTTP_REFERER']` directly — always use `$request->safeRedirectBack()`.
