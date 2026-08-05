---
title: Session Auth
description: "Store authenticated user state in the PHP session. Perfect for traditional web apps with login forms, redirects, and server-rendered views."
---

# Session Auth

> Store authenticated user state in the PHP session. Perfect for traditional web apps with login forms, redirects, and server-rendered views.

After login, LitePHP stores identity in the server-side PHP session and reads it back each request — no tokens or headers, just a cookie mapped to session data.

### Configuration

```php
// config/auth.php
return [
    'model'          => App\Models\User::class,
    'username_field' => 'email',
    'password_field' => 'password',
];
```

Override the model at deploy time via `AUTH_MODEL` in `.env`.

### User Model

```php
// app/Models/User.php
namespace App\Models;
use Core\Database\Model;

class User extends Model
{
    protected string $table = 'users';
    protected array $fillable = ['name', 'email', 'password'];
    protected array $hidden = ['password'];
}
```

> **Note:** `Auth::attempt()` automatically strips the `password_field` value from session data, even if you forget `$hidden`.

### Logging In

```php
use Core\Auth\Auth;
use Core\Http\Request;

class LoginController extends Controller
{
    public function store(Request $request)
    {
        $credentials = $request->only(['email', 'password']);

        if (Auth::attempt($credentials)) {
            session()->regenerate(); // rotate session ID after login
            return redirect('/dashboard');
        }

        return back()->with('error', 'Invalid credentials');
    }
}
```

> **Tip:** Always call `session()->regenerate()` right after login to prevent session-fixation attacks.

### Checking Auth Status

```php
Auth::check()   // bool — logged in?
Auth::guest()   // bool — NOT logged in?
Auth::user()    // array|null — user data from session
Auth::id()      // int|string|null

auth()->check()
auth()->user()
auth_id()       // alias for Auth::id()
is_logged_in()  // alias for Auth::check()
auth_user()     // alias for auth()->user()
```

> **Note:** `Auth::user()` returns an **array**, not a model instance — it's serialized into the session at login. Hydrate back into a model if you need ORM methods.

### Manual Login (Without Password Verification)

For OAuth callbacks, magic links, admin impersonation:

```php
use Core\Auth\Auth;
use App\Models\User;

$user = User::findOrFail($id);
Auth::login($user->toArray()); // Auth strips the password field automatically
```

### Logging Out

```php
use Core\Auth\Auth;

class LogoutController extends Controller
{
    public function destroy()
    {
        Auth::logout(); // destroys the entire session
        return redirect('/login');
    }
}
```

### Protecting Routes with Middleware

```php
// routes/web.php
use App\Controllers\DashboardController;
use App\Controllers\ProfileController;

Route::group('/dashboard', function () {
    Route::get('/', [DashboardController::class, 'index']);
    Route::get('/profile', [ProfileController::class, 'show']);
}, ['auth']);
```

### Full Login and Registration Example

```php
// RegisterController.php
namespace App\Controllers;
use App\Models\User;
use Core\Http\Request;

class RegisterController extends Controller
{
    public function create() { return view('auth.register'); }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'                  => 'required|min:2|max:100',
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
        ]);

        return redirect('/login')->with('success', 'Account created! Please log in.');
    }
}
```

```php
// LoginController.php
namespace App\Controllers;
use Core\Auth\Auth;
use Core\Http\Request;

class LoginController extends Controller
{
    public function create() { return view('auth.login'); }

    public function store(Request $request)
    {
        $credentials = $request->only(['email', 'password']);

        if (Auth::attempt($credentials)) {
            session()->regenerate();
            return redirect()->intended('/dashboard');
        }

        return back()
            ->withInput($request->only(['email']))
            ->with('error', 'These credentials do not match our records.');
    }
}
```

### Password Reset Flow

Tokens hashed with SHA-256 before storage — only the plaintext is emailed.

```php
// ForgotPasswordController.php
use Core\Auth\PasswordReset;

public function store(Request $request)
{
    $email = $request->input('email');
    $token = PasswordReset::createToken($email); // deletes existing tokens for that address first

    Mail::send(new ResetPasswordMail($email, $token));

    return back()->with('status', 'Check your inbox for a reset link.');
}
```

```php
// ResetPasswordController.php
use Core\Auth\PasswordReset;

public function update(Request $request)
{
    // handles expiry checking (default 1 hour) + constant-time token comparison
    $success = PasswordReset::reset(
        $request->input('email'),
        $request->input('token'),
        $request->input('password')
    );

    if (!$success) {
        return back()->with('error', 'This reset link is invalid or has expired.');
    }

    return redirect('/login')->with('success', 'Password updated. Please log in.');
}
```

> **Note:** The `password_resets` table must exist first, with columns `email` (indexed string), `token` (string), `created_at` (timestamp).

> **Warning:** Never log or display the raw `$token` — it's a single-use credential.
