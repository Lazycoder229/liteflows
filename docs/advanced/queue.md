---
title: Queue
description: "Offload slow tasks like emails, image processing, and notifications to database-backed background workers using LitePHP's HMAC-secured job queue."
---

# Queue

> Offload slow tasks like emails, image processing, and notifications to database-backed background workers using LitePHP's HMAC-secured job queue.

Jobs serialized into a DB table, HMAC-signed for tamper protection, processed by a worker process.

### Setup

```bash
php lite queue:migrate
```

Creates `jobs` and `failed_jobs` tables, including the `sig` HMAC-signature column.

> **Note:** `APP_KEY` must be ≥16 characters — used as the HMAC secret for every job payload.

### Creating a Job

```bash
php lite make:job SendWelcomeEmail
```

```php
namespace App\Jobs;
use Core\Queue\Job;
use App\Models\User;
use App\Mail\WelcomeEmail;

class SendWelcomeEmail extends Job
{
    public int    $tries      = 3;         // retries
    public int    $retryAfter = 60;        // seconds between retries
    public string $queue      = 'emails';  // named queue, default 'default'

    public function __construct(private int $userId) {}

    public function handle(): void
    {
        $user = User::findOrFail($this->userId);
        mail_send((new WelcomeEmail($user))->to($user->email)->subject('Welcome to ' . config('app.name')));
    }

    public function failed(\Throwable $e): void
    {
        log_message('error', 'SendWelcomeEmail failed for user ' . $this->userId . ': ' . $e->getMessage());
    }
}
```

| Property | Default | Description |
|---|---|---|
| `$tries` | `3` | Max attempts before buried as failed |
| `$retryAfter` | `60` | Seconds before releasing for next retry |
| `$queue` | `'default'` | Named queue |

### Dispatching a Job

```php
SendWelcomeEmail::dispatch($userId);                          // immediate
SendWelcomeEmail::dispatch($userId, delay: 300);               // 5-min delay
SendWelcomeEmail::dispatch($userId, queue: 'emails');          // named queue
SendWelcomeEmail::dispatch($userId, delay: 60, queue: 'emails');

// Or directly via Queue::push()
use Core\Queue\Queue;
Queue::push(new SendWelcomeEmail($userId));
Queue::push(new SendWelcomeEmail($userId), 60); // 60s delay
```

### Complete Dispatch and Handle Cycle

```php
// app/Jobs/ResizeUserAvatar.php
namespace App\Jobs;
use Core\Queue\Job;

class ResizeUserAvatar extends Job
{
    public int    $tries      = 3;
    public int    $retryAfter = 30;
    public string $queue      = 'images';

    public function __construct(private int $userId, private string $filePath) {}

    public function handle(): void
    {
        $image = imagecreatefromjpeg(storage_path($this->filePath));
        $thumb = imagescale($image, 200, 200);
        imagejpeg($thumb, storage_path('avatars/' . $this->userId . '.jpg'), 90);
        imagedestroy($image);
        imagedestroy($thumb);
        \App\Models\User::where('id', $this->userId)->update(['avatar_processed' => true]);
    }

    public function failed(\Throwable $e): void
    {
        log_message('error', "Avatar resize failed for user {$this->userId}: " . $e->getMessage());
        \App\Models\User::where('id', $this->userId)->update(['avatar_processed' => false, 'avatar_error' => $e->getMessage()]);
    }
}
```

```php
// app/Controllers/ProfileController.php
namespace App\Controllers;
use App\Jobs\ResizeUserAvatar;

class ProfileController
{
    public function uploadAvatar(): never
    {
        $file = request()->file('avatar');
        $path = 'uploads/raw/' . auth_id() . '_' . time() . '.jpg';
        move_uploaded_file($file['tmp_name'], storage_path($path));

        ResizeUserAvatar::dispatch(auth_id(), $path, queue: 'images'); // returns immediately

        flash('success', 'Avatar uploaded! It will be processed shortly.');
        redirect('/profile');
    }
}
```

```bash
php lite queue:work --queue=images
```

Worker picks up jobs, calls `handle()`, deletes on success; retries up to `$tries` on failure then calls `failed()` and moves to `failed_jobs`.

### Running the Worker

```bash
php lite queue:work                 # continuous (production)
php lite queue:work --once          # one job then exit
php lite queue:work --queue=emails  # only 'emails' queue
php lite queue:work --sleep=3       # sleep seconds when queue empty
```

> **Tip:** Run multiple workers targeting different named queues to prioritize urgent work.

### Running in Production (Supervisor)

```ini
[program:litephp-worker]
command=php /var/www/myapp/lite queue:work --sleep=3
directory=/var/www/myapp
user=www-data
autostart=true
autorestart=true
numprocs=2
stdout_logfile=/var/www/myapp/storage/logs/worker.log
stderr_logfile=/var/www/myapp/storage/logs/worker-error.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start litephp-worker:*
```

> **Warning:** Workers load app code at startup — restart after deploys (Supervisor's `autorestart` only handles crashes, not deploys). Add `supervisorctl restart litephp-worker:*` to your deploy script.

### Failed Jobs

```bash
php lite queue:failed   # list all failed jobs
```

```sql
SELECT queue, exception, failed_at FROM failed_jobs ORDER BY failed_at DESC;
```

### Checking Queue Size

```php
use Core\Queue\Queue;
$pending = Queue::size();          // default queue
$pending = Queue::size('emails');  // named queue
```

### Best Practices

- Implement `failed()` for critical jobs (payments, notifications, account changes) — alert, log externally, or flag for admin.
- Use specific queue names (`emails`, `notifications`, `reports`) rather than relying on `default`.
- Set `$tries = 1` for non-idempotent jobs (e.g. charging a card); `$tries = 3` is a safe default otherwise.
