---
title: Quickstart
description: "Install LiteFlow, configure your environment, connect a database, and define your first route — all in a single guided walkthrough."
---

# Quickstart

> Install LitePHP, configure your environment, connect a database, and define your first route — all in a single guided walkthrough.

### 1. Install via Composer
Run this command in your terminal to create a new LiteFlow project:

```bash
composer create-project litephp/app my-app
cd my-app
```

### 2. Set up your environment

```bash
cp .env.example .env
php lite env:init
php lite key:generate
```

`env:init` checks that all required keys are present in your `.env` file. `key:generate` writes a random base64 string to `APP_KEY`, which the framework uses for encryption and signed cookies.

### 3. Install frontend dependencies

Run this command inside your newly created project to install frontend dependencies:

```bash
npm install
```

### 4. Define your first route

Create your first route in app/Routes.

```php
<?php
// app/Routes/web.php
use App\Controller\WelcomeController;

Route::get('/welcome', [WelcomeController::class, 'index']);
```
:::info
You will get an error for the meantime because **WelcomeController** doesn't exist yet.
:::

### 5. Create a controller
Run this command to create a new controller using the lite cli command:

```bash
php lite make:controller WelcomeController
```
Open **app/Controller/WelcomeController**, you will see something like this:

```php
<?php
use Core\Controller;

class WelcomeController extends Controller {
    public function index() {
        $this->view('welcome');
    }
}
```

:::info
The argument inside the **view()** method is the file name of the view.
:::

After this you will notice the error in **app/Routes** is gone, because **WelcomeController** already exists now.

### 6. Creating your first view
Run this command in your terminal to create a new view.

```bash
php lite make:view welcome
```
After that, go to **view/welcome.lites** then paste this:

```php
@extends('layout.blanks')
@section('content')
<div>
    <h1>Welcome to LiteFlow</h1>
</div>
@endsection
```
:::info
The name of this view must match the argument in your controller.
If you name it differently from your controller, you will get an error stating that **welcome** is not defined.
:::

### 7. Start the development server
Run this to start both the PHP server and Vite server at once:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

::: warning
Don't open this link, it only serves Vite:
`http://localhost:5173`
:::

You will see **Welcome to LiteFlow** in your browser.

:::warning
IF YOU ENCOUNTER ISSUES RUNNING THE APPLICATION, PLEASE CHECK YOUR **.env** file for an **APP_KEY**.
:::

> **Congrats!!!** You just ran your first LiteFlow project.