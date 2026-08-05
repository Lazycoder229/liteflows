---
title: Models
description: "Learn how to define LitePHP ORM models, protect against mass assignment vulnerabilities, perform CRUD operations, use soft deletes, and run transactions."
---

# Models

> Learn how to define LitePHP ORM models, protect against mass assignment vulnerabilities, perform CRUD operations, use soft deletes, and run transactions.

Every database table is represented by a **Model** extending `Core\Database\Model`, giving you mass-assignment protection, automatic timestamps, serialization, soft deletes, and transactions.

### Creating a Model

```bash
php lite make:model Post
```

```php
namespace App\Models;
use Core\Database\Model;

class Post extends Model
{
    protected static string $table = 'posts';          // defaults to plural snake_case
    protected static string $primaryKey = 'id';         // defaults to 'id'
    protected static array $fillable = ['title', 'body', 'user_id', 'status'];
    protected static array $hidden = ['password', 'remember_token']; // excluded from toArray()/toJson()
}
```

All config properties (`$table`, `$primaryKey`, `$fillable`, `$guarded`, `$hidden`, `$timestamps`) are `static`, resolved via `static::` so subclasses override independently. If `$table` is omitted, LitePHP derives it: `BlogPost` → `blog_posts`, `User` → `users`.

### Mass Assignment

Deny-by-default: if `$fillable` isn't declared, nothing can be mass-assigned.

| Property | Behaviour |
|---|---|
| `$fillable = ['col1', 'col2']` | **Only** these columns are mass-assignable |
| `$guarded = ['id', 'role']` | Blocked even if listed in `$fillable` |
| `$guarded = ['*']` (default) | Everything blocked unless `$fillable` is non-empty |

> **Warning:** Always define `$fillable` explicitly — the default blocks all `create()`/`update()` writes silently.

```php
class User extends Model
{
    protected static array $fillable = ['name', 'email', 'password'];
    protected static array $guarded = ['id', 'is_admin', 'role'];
}
```

### Creating Records

```php
// create() — mass assignment insert
$post = Post::create(['title' => 'Hello World', 'body' => 'My first post', 'user_id' => auth()->id(), 'status' => 'draft']);
echo $post->id; // e.g. 42

// new + save() — attribute-by-attribute
$post = new Post();
$post->title = 'Hello World';
$post->body = 'My first post';
$post->user_id = auth()->id();
$post->save();

// firstOrCreate() — insert only if not found
$user = User::firstOrCreate(
    ['email' => 'alice@example.com'],
    ['name' => 'Alice', 'password' => bcrypt('secret')]
);

// updateOrCreate() — upsert
$post = Post::updateOrCreate(
    ['slug' => 'hello-world'],
    ['title' => 'Hello World', 'body' => 'Updated content']
);
```

### Reading Records

```php
$post = Post::find(1);       // null if not found
$post = Post::findOrFail(1); // RuntimeException if not found
$posts = Post::all();        // array of Post instances

$posts = Post::query()
    ->where('status', 'published')
    ->orderBy('created_at', 'DESC')
    ->limit(10)
    ->get();

$post = Post::query()->where('slug', 'hello-world')->first(); // null if not found
```

### Updating Records

```php
$post = Post::findOrFail(1);
$post->update(['title' => 'New Title', 'status' => 'published']); // mass update

$post = Post::findOrFail(1);
$post->title = 'New Title';
$post->save(); // attribute assignment
```

Both update `updated_at` automatically when `$timestamps` is `true` (default).

### Deleting Records

```php
$post = Post::findOrFail(1);
$post->delete();       // delete loaded instance

Post::destroy(1);      // static destroy by ID — hard DELETE, no model load
```

> **Warning:** `destroy()` issues a hard `DELETE` directly. If the model uses `SoftDeletes`, call `$post->delete()` on a loaded instance instead.

### Soft Deletes

```php
namespace App\Models;
use Core\Database\Model;
use Core\Database\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;
    protected static array $fillable = ['title', 'body', 'status'];
}
```

Migration must include `deleted_at`:

```php
$this->schemaCreate('posts', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->longText('body');
    $table->timestamps();
    $table->softDeletes(); // adds `deleted_at` TIMESTAMP NULL DEFAULT NULL
});
```

```php
$post = Post::findOrFail(1);
$post->delete();      // sets deleted_at — row stays
$post->restore();     // clears deleted_at
$post->forceDelete(); // physically removes (irreversible)
$post->trashed();     // true if deleted_at is set
```

Standard queries auto-exclude soft-deleted rows:

```php
Post::all();                 // only active
Post::withTrashed()->get();  // active + soft-deleted
Post::onlyTrashed()->get();  // only soft-deleted
```

### Service Layer Integration

```php
// app/Services/PostService.php
namespace App\Services;
use App\Models\Post;

class PostService
{
    public function publish(int $id): Post
    {
        return Post::transaction(function () use ($id) {
            $post = Post::findOrFail($id);
            $post->update(['status' => 'published']);
            return $post;
        });
    }

    public function latestPublished(int $perPage = 15, int $page = 1): array
    {
        return Post::query()
            ->with('author', 'tags')
            ->where('status', 'published')
            ->orderBy('created_at', 'DESC')
            ->paginate($perPage, $page);
    }
}
```

### Accessors

```php
$post = Post::findOrFail(1);
echo $post->title;      // reads $attributes['title']
echo $post->created_at;
echo $post->user_id;
if (isset($post->published_at)) { /* exists and non-null */ }
```

### Serialization

```php
class User extends Model { protected static array $hidden = ['password', 'remember_token']; }

$user = User::findOrFail(1);
$data = $user->toArray(); // hidden keys excluded

$json = $user->toJson();
$json = $user->toJson(JSON_PRETTY_PRINT); // any JSON_* flag
```

### Transactions

```php
// Manual
Post::beginTransaction();
try {
    $post = Post::create(['title' => 'Hello World', 'user_id' => auth()->id()]);
    Tag::create(['post_id' => $post->id, 'name' => 'php']);
    Post::commit();
} catch (\Exception $e) {
    Post::rollback();
    throw $e;
}

// transaction() closure helper — auto begin/commit/rollback
$post = Post::transaction(function () {
    $post = Post::create(['title' => 'Hello World', 'user_id' => auth()->id()]);
    Tag::create(['post_id' => $post->id, 'name' => 'php']);
    return $post;
});
```

> **Note:** `beginTransaction()`, `commit()`, `rollback()` are proxies to the underlying connection — callable on any model class, they share the same connection.
