---
title: Relationships
description: "Define hasOne, hasMany, belongsTo, and belongsToMany relationships in LitePHP models, attach pivot records, and eliminate N+1 queries with eager loading."
---

# Relationships

> Define hasOne, hasMany, belongsTo, and belongsToMany relationships in LitePHP models, attach pivot records, and eliminate N+1 queries with eager loading.

Four relationship types, each defined as a method on your model, resolved with a targeted query on first access:

- **hasOne** — one-to-one. FK lives on the related table.
- **hasMany** — one-to-many. FK lives on the related table.
- **belongsTo** — inverse of hasOne/hasMany. FK lives on this model's table.
- **belongsToMany** — many-to-many via a pivot table.

### hasOne

`hasOne(string $related, string $foreignKey)`:

```php
namespace App\Models;
use Core\Database\Model;

class User extends Model
{
    protected static array $fillable = ['name', 'email', 'password'];

    public function profile(): ?object
    {
        return $this->hasOne(Profile::class, 'user_id'); // WHERE user_id = $this->id
    }
}
```

```php
$this->schemaCreate('profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users');
    $table->text('bio')->nullable();
    $table->string('avatar')->nullable();
    $table->timestamps();
});
```

```php
$user    = User::findOrFail(1);
$profile = $user->profile(); // calls method → fires one query
echo $profile->bio;
```

### hasMany

`hasMany(string $related, string $foreignKey)` returns a `QueryBuilder`:

```php
class Post extends Model
{
    protected static array $fillable = ['title', 'body', 'user_id', 'status'];

    public function comments(): QueryBuilder
    {
        return $this->hasMany(Comment::class, 'post_id'); // SELECT * FROM comments WHERE post_id = ?
    }
}
```

```php
$post     = Post::findOrFail(1);
$comments = $post->comments()->get();

// filter before executing
$approved = $post->comments()->where('approved', true)->orderBy('created_at', 'DESC')->get();
```

### belongsTo

`belongsTo(string $related, string $foreignKey, string $ownerKey = 'id')`:

```php
class Comment extends Model
{
    protected static array $fillable = ['post_id', 'user_id', 'body', 'approved'];

    public function post(): ?object { return $this->belongsTo(Post::class, 'post_id', 'id'); }
    public function author(): ?object { return $this->belongsTo(User::class, 'user_id', 'id'); }
}
```

```php
$comment = Comment::findOrFail(1);
echo $comment->post()->title;
echo $comment->author()->name;
```

### belongsToMany

`belongsToMany(string $related, string $pivotTable, string $foreignKey, string $relatedKey)`:

```php
class Post extends Model
{
    protected static array $fillable = ['title', 'body', 'user_id', 'status'];

    public function tags(): array
    {
        return $this->belongsToMany(Tag::class, 'post_tag', 'post_id', 'tag_id');
    }
}

class Tag extends Model
{
    protected static array $fillable = ['name', 'slug'];

    public function posts(): array
    {
        return $this->belongsToMany(Post::class, 'post_tag', 'tag_id', 'post_id');
    }
}
```

Pivot table migration — only the two FKs, no surrogate PK, no timestamps:

```php
class CreatePostTagTable extends Migration
{
    public function up(): void
    {
        $this->schemaCreate('post_tag', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained('posts');
            $table->foreignId('tag_id')->constrained('tags');
        });
    }
    public function down(): void { $this->dropTable('post_tag'); }
}
```

```php
$post = Post::findOrFail(1);
$tags = $post->tags(); // array of Tag instances
```

### Managing Pivot Records: attach() / detach()

```php
// attach(pivotTable, foreignKey, relatedKey, relatedId, extra = [])
$post = Post::findOrFail(1);
$post->attach('post_tag', 'post_id', 'tag_id', 3);

foreach ([1, 2, 3] as $tagId) { $post->attach('post_tag', 'post_id', 'tag_id', $tagId); }

$post->attach('post_tag', 'post_id', 'tag_id', 5, ['featured' => true]); // extra pivot columns
```

`attach()` uses `INSERT IGNORE` — safe to attach the same ID twice.

```php
// detach(pivotTable, foreignKey, relatedKey, relatedId)
$post->detach('post_tag', 'post_id', 'tag_id', 3);
```

### Eager Loading Relationships

```php
// N+1 — avoid
$posts = Post::all();
foreach ($posts as $post) { echo $post->author()->name; } // 1 query per post

// with() — batch load
$posts = Post::query()->with('author')->get();
foreach ($posts as $post) { echo $post->author->name; } // zero extra queries — 2 total

$posts = Post::query()->with('author', 'tags', 'comments')->where('status', 'published')->get();
```

LitePHP batches eager-loaded `hasMany`/`hasOne` relations with a single `WHERE foreign_key IN (...)` query. `belongsTo` relations are deduplicated by parent primary key — 50 posts by the same author fetch that author once.

> **Tip:** Add `with()` at the query level (controller/service), not inside the relationship method — keeps the relation method reusable.

### Practical Example

```php
public function index(): array
{
    $page = (int) request()->query('page', 1);
    // 3 queries total regardless of page size: posts + authors + tags
    $result = Post::query()
        ->with('author', 'tags')
        ->where('status', 'published')
        ->orderBy('created_at', 'DESC')
        ->paginate(10, $page);
    return response()->json($result);
}

public function show(int $id): array
{
    $post = Post::query()
        ->with('author', 'comments')
        ->where('id', $id)
        ->where('status', 'published')
        ->firstOrFail();
    return response()->json($post->toArray());
}
```

### Relationship Tips

> **Note:** `hasMany()` returns a `QueryBuilder`, so you can chain `.where()`, `.orderBy()`, `.limit()` before `.get()`.

> **Tip:** Pivot tables should hold exactly the two foreign keys — avoid adding a surrogate `id` PK.

> **Warning:** Accessing `$model->relation()` inside a loop without eager loading is the most common ORM performance mistake.
