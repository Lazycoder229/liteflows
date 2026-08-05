---
title: Validation
description: "Validate HTTP input with 20+ built-in rules, FormRequest classes, and custom Rule objects. Handle errors in templates and API responses in LitePHP."
---

# Validation

> Validate HTTP input with 20+ built-in rules, FormRequest classes, and custom Rule objects. Handle errors in templates and API responses in LitePHP.

### Basic Validation in a Controller

```php
public function store(Request $request): void
{
    $data = $request->validate([
        'name'  => 'required|min:2|max:100',
        'email' => 'required|email|unique:users,email',
        'age'   => 'required|integer|min:18',
    ]);
    User::create($data); // $data only contains name, email, age
}
```

On failure, `ValidationException` is thrown and LitePHP redirects back with errors + old input flashed automatically.

### Using the Validator Directly

```php
use Core\Validation\Validator;

$validator = Validator::make($request->all(), [
    'title'  => 'required|min:3|max:255',
    'body'   => 'required|min:10',
    'status' => 'required|in:draft,published',
]);

if ($validator->fails()) {
    return JsonResponse::validationError($validator->errors()); // ['field' => ['msg', ...]]
}

$data = $validator->validated(); // only validated fields
Post::create($data);
```

### All Built-in Rules

Combine with `|` in a string, or as array elements.

| Rule | Example | Description |
|---|---|---|
| `required` | `required` | Present and non-empty |
| `string` | `string` | Letters only (no digits/special chars) |
| `integer` | `integer` | Valid integer |
| `numeric` | `numeric` | Integer or float |
| `boolean` | `boolean` | `true`, `false`, `1`, or `0` |
| `email` | `email` | Syntactically valid email |
| `url` | `url` | Valid URL |
| `min` | `min:3` | Min string length / min numeric value |
| `max` | `max:255` | Max string length / max numeric value |
| `in` | `in:draft,published,archived` | One of the listed options |
| `confirmed` | `confirmed` | Must match `{field}_confirmation` |
| `regex` | `regex:/^[a-z]+$/` | Must match the pattern |
| `date` | `date` | Parseable date string |
| `after` | `after:2024-01-01` | Date after given date/field |
| `before` | `before:end_date` | Date before given date/field |
| `unique` | `unique:users,email` | Not already in table/column |
| `exists` | `exists:categories,id` | Must exist in table/column |
| `nullable` | `nullable` | Allow null (skips further rules when null) |
| `sometimes` | `sometimes` | Validate only if present |
| `array` | `array` | Must be a PHP array |
| `digits_between` | `digits_between:6,10` | Digit count within range |
| `file` | `file` | Successfully uploaded file |
| `mimes` | `mimes:jpg,png,pdf` | File matches one of the MIME types |
| `image` | `image` | Valid image (jpg, jpeg, png, gif, webp, svg) |

> **Note:** `string` checks letters only (spaces stripped first) — use `regex` for alphanumeric/digits/special chars. `after`/`before` accept a date string or another field's name.

### Combining Rules

```php
$rules = [
    'name'     => 'required|string|min:2|max:100',
    'email'    => 'required|email|unique:users,email',
    'password' => 'required|min:8|confirmed', // expects password_confirmation
    'age'      => 'nullable|integer|min:18|max:120',
    'avatar'   => 'nullable|file|image',
    'website'  => 'nullable|url',
    'role'     => 'sometimes|in:user,editor,admin',
    'start_date' => 'required|date',
    'end_date'   => 'required|date|after:start_date',
    'otp_code' => 'required|digits_between:6,8',
    'category_ids' => 'required|array',
];
```

### Complete Form Validation Flow

```php
namespace App\Controllers;
use Core\Validation\Validator;

class RegistrationController
{
    public function store(): never
    {
        $validator = Validator::make(request()->all(), [
            'name'                  => 'required|string|min:2|max:100',
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        if ($validator->fails()) {
            flash('_errors', $validator->errors());
            flash('_old',    request()->all());
            redirect('/register');
        }

        $data = $validator->validated();
        $data['password'] = bcrypt($data['password']);

        User::create($data);
        flash('success', 'Account created! Please log in.');
        redirect('/login');
    }
}
```

```html
<!-- app/views/auth/register.lites -->
@extends('layouts.app')
@section('content')
<form method="POST" action="/register">
    @csrf
    <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" value="{{ old('name') }}"
            class="{{ hasError('name') ? 'is-invalid' : '' }}">
        @if(hasError('name'))<p class="error-text">{{ errors('name') }}</p>@endif
    </div>
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" value="{{ old('email') }}"
            class="{{ hasError('email') ? 'is-invalid' : '' }}">
        @if(hasError('email'))<p class="error-text">{{ errors('email') }}</p>@endif
    </div>
    <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password">
        @if(hasError('password'))<p class="error-text">{{ errors('password') }}</p>@endif
    </div>
    <div class="form-group">
        <label for="password_confirmation">Confirm Password</label>
        <input type="password" id="password_confirmation" name="password_confirmation">
    </div>
    <button type="submit">Create Account</button>
</form>
@endsection
```

### FormRequest Classes

```php
<?php
namespace App\Requests;
use Core\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool { return auth_user() !== null; }

    public function rules(): array
    {
        return [
            'title'       => 'required|min:3|max:255',
            'body'        => 'required|min:10',
            'status'      => 'required|in:draft,published',
            'category_id' => 'required|exists:categories,id',
        ];
    }
}
```

```php
use App\Requests\StorePostRequest;

public function store(StorePostRequest $request): void
{
    $post = Post::create($request->validated());
    return JsonResponse::created($post->toArray());
}
```

### Custom Rule Objects

Implement `Core\Validation\Rule`: `passes()` (returns bool) and `message()` (error string, `:field` placeholder):

```php
<?php
namespace App\Rules;
use Core\Validation\Rule;
use Core\Validation\Validator;

class NoSpamWords implements Rule
{
    private array $spamWords = ['casino', 'viagra', 'free money'];

    public function passes(string $field, mixed $value, Validator $validator): bool
    {
        foreach ($this->spamWords as $word) {
            if (stripos((string) $value, $word) !== false) return false;
        }
        return true;
    }

    public function message(string $field): string { return 'The :field contains prohibited content.'; }
}
```

```php
use Core\Validation\Validator;
use App\Rules\NoSpamWords;

$validator = Validator::make($request->all(), [
    'comment' => ['required', 'min:5', 'max:2000', new NoSpamWords()],
    'title'   => ['required', new NoSpamWords()],
]);
```

### Displaying Errors in Templates

```html
<form method="POST" action="/register">
    @csrf
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" value="{{ old('email') }}"
            class="{{ hasError('email') ? 'is-invalid' : '' }}">
        @if(hasError('email'))<p class="error-text">{{ errors('email') }}</p>@endif
    </div>
    <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password">
        @if(hasError('password'))<p class="error-text">{{ errors('password') }}</p>@endif
    </div>
    <button type="submit">Register</button>
</form>
```

Full error summary:

```html
@php $allErrors = errors(); @endphp
@if(!empty($allErrors))
    <div class="alert alert-danger">
        <strong>Please fix the following errors:</strong>
        <ul>
            @foreach($allErrors as $field => $messages)
                @foreach($messages as $message)<li>{{ $message }}</li>@endforeach
            @endforeach
        </ul>
    </div>
@endif
```

### API Validation Responses

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": { "email": "The email field is required.", "password": "The password must be at least 8 characters." }
}
```

```php
use Core\Validation\Validator;

$validator = Validator::make($request->all(), ['email' => 'required|email', 'password' => 'required|min:8']);

if ($validator->fails()) {
    return JsonResponse::validationError($validator->errors());
}
```

> **Tip:** Use `$validator->validated()`, not `$request->all()`, when creating/updating models — prevents mass-assignment of unexpected input.
