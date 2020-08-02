---
title: An interesting adventure with a PHP CMS // Part 2
description: A continuation of developing a CMS with the Slim microframework
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: An interesting adventure with a PHP CMS // Part 2
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

So I left off talking about the ```settings.php``` and ```index.php```. Prior to continuing, I believe I should mention a recent newsletter from [Heroku](https://blog.heroku.com/ten-ways-to-secure-your-apps?c=7013A000000ZKSnQAO&utm_campaign=Newsletter_March_2019&utm_medium=email&utm_source=newsletter&utm_content=blog&utm_term=ten-ways-secure-app) that covers security. Within the newsletter one method to maintaining a safe site, and in general good practice, is to keep your pacakges up to date. Therefore, lets run

	composer update

This command will update all packages found in the ```composer.json``` under the ```require``` and ```require-dev``` sections.

So following the order of required php files in the ```index.php```, the subsequent file would be ```dependencies.php```. For security reasons and for simplicity I will only show some of the code in my file.

	<?php
	// DIC configuration
	$container = $app->getContainer();

	// Twig extension
	// https://github.com/aptoma/twig-markdown
	use Aptoma\Twig\Extension\MarkdownExtension;
	use Aptoma\Twig\Extension\MarkdownEngine;

	$engine = new MarkdownEngine\MichelfMarkdownEngine();

	// View
	$container['view'] = function ($c) {
			global $engine;
			$view = new \Slim\Views\Twig($c['settings']['view']['template_path'], $c['settings']['view']['twig']);
			// Add extensions
			$view->addExtension(new Slim\Views\TwigExtension($c['router'], $c['request']->getUri()));
	//    $view->addExtension(new Bookshelf\TwigExtension($c['flash']));
			$view->addExtension(new MarkdownExtension($engine));
			$view->addExtension(new Site\AppModeExtension());
			$view->addExtension(new Site\RandomIdExtension());
			return $view;
	};

	// CSRF guard
	$container['csrf'] = function ($c) {
			$guard = new \Slim\Csrf\Guard();
			$guard->setFailureCallable(function ($request, $response, $next) {
					$request = $request->withAttribute("csrf_status", false);
					return $next($request, $response);
			});
			return $guard;
	};

	// Flash messages
	$container['flash'] = function ($c) {
			return new \Slim\Flash\Messages;
	};

	// monolog
	$container['logger'] = function ($c) {
			$settings = $c->get('settings')['logger'];
			$logger = new Monolog\Logger($settings['name']);
			$logger->pushProcessor(new Monolog\Processor\UidProcessor());
			$logger->pushHandler(new Monolog\Handler\StreamHandler($settings['path'], $settings['level']));
			return $logger;
	};

	// Database
	$capsule = new Illuminate\Database\Capsule\Manager;
	$capsule->addConnection($container['settings']['db']);
	$capsule->setAsGlobal();
	$capsule->bootEloquent();
	$container['db'] = function ($c) use ($capsule) {
			return $capsule;
	};
	
	$container[Blog\BlogController::class] = function ($c) {
    $view = $c->get('view');
    $logger = $c->get('logger');
    $router = $c->get('router');
    $flash = $c->get('flash');
    return new \Blog\BlogController($view, $logger, $router, $flash);
};

As you can see the ```dependencies.php``` holds all the dependency injection containers (DICs). In other words, I will include containers for twig (view), csrf guard, flash messaging, loggers, database connections, controllers, etc. Essentially anything and all that is related to the app that we can configure immediately and store so that when the time comes we can use them.

The next import file is the ```middleware.php`` file. As an example,

	<?php
	// Application middleware

	$app->add($app->getContainer()->get('csrf'));

I placed the csrf guard in the middleware as documented by Slim. The middleware file is meant to run code before and after your Slim application to manipulate the ```request``` and ```response``` objects.

The last file required is the ```routes.php```. Again, for security reasons I can only show partial information:

	<?php

	use Slim\Http\Request;
	use Slim\Http\Response;

	// Index
	$app->get('/', 'Site\IndexController:loadSite')->setName('site');

	$app->get('/admin', 'Admin\SomeController:loadAdminSite')
			->setName('admin-site');
			
The routes file contains all your routing. There are multiple ways of writing this file; however, I use controllers and so I need to use the callable ```Site\IndexController:loadSite```, for instance, where ```Site``` is a namespace/folder, IndexController is the class, and loadSite is the function called to render the page. The setName('site') allows me to refer to this route quickly and easily by using a function like ```pathFor``` in PHP or ```path_for``` in Twig.

To be continued ...
