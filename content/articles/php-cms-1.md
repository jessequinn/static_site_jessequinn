---
title: An interesting adventure with a PHP CMS // Part 1
description: A walk-through of PHP, Heroku, Mysql and the Slim microframework for web development
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: An interesting adventure with a PHP CMS // Part 1
featured: false
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

### Introduction
I have been playing around with both [Python](https://www.python.org/) and [PHP](http://php.net/) for web development. Although, I absolutely love Python, I found that PHP was a lot fun, more so than Python. PHP is certainly a challenging language for some, especially, with the OOP-style, controllers, middlewares, routing, frameworks, twig extensions, etc.  in comparison to what I remember 8-10 years ago when I hosted my first PHP based site along with [Apache](https://httpd.apache.org/) and procedural style PHP. I suppose an equally comparable language would be [React](https://reactjs.org/) (a Javascript based framework). However, today, I must say that the language has come along quite nicely, but I am not here to compare any language but rather detail the process of working with the [Slim PHP Framework](http://www.slimframework.com/), Eloquent, and the [Heroku host service](https://www.heroku.com/).

To begin, I wanted to move my site from a [Flask](http://flask.pocoo.org/) based site to a PHP content management system (CMS). So I went to the drawing board and designed an entirely new site including admin section to allow for easier posting, modifications, etc. However, the challenge was really deciding, which framework, if any, should be used for my CMS. 

### Slim Microframework
I eventually opted to use the Slim microframework. I thought it was intuitive with decent documentation and extensibility. To work with slim, it is best to install [Composer](https://getcomposer.org/), a dependency manager for PHP, as a global command. This is easily accomplished with Manjaro/Archlinux as Composer can be found in the extra repository. Once installed simply use the following command:

	composer create-project slim/slim-skeleton [my-app-name]

**Replace [my-app-name] with the desired directory name for your new application.**
	
Running a ```tree -I vendor``` should produce a project structure as

	.
	├── composer.json
	├── composer.lock
	├── CONTRIBUTING.md
	├── docker-compose.yml
	├── logs
	│   └── README.md
	├── phpunit.xml
	├── public
	│   └── index.php
	├── README.md
	├── src
	│   ├── dependencies.php
	│   ├── middleware.php
	│   ├── routes.php
	│   └── settings.php
	├── templates
	│   └── index.phtml
	└── tests
			└── Functional
					├── BaseTestCase.php
					└── HomepageTest.php

If you have experience with Slim then you can easily run 

    composer require slim/slim
		
and modify the ```composer.json``` with

	"scripts": {
		"start": "php -S localhost:8888 -t public public/index.php",
	}

My project folder looks like

	.
	├── logs
	├── public
	│   ├── dist
	│   │   ├── css
	│   │   └── js
	│   ├── images
	│   └── pdf
	├── src
	│   ├── Admin
	│   ├── Blog
	│   ├── Data
	│   ├── Login
	│   ├── Registration
	│   ├── Site
	│   └── Templates
	│       ├── admin
	│       ├── blog
	│       ├── login
	│       ├── registration
	│       └── site
	└── tests
			└── Functional

The ```vendor``` folder is created once you have installed a package via ```composer require```. The ```public``` folder is where I place any file that will be web accessible such as the ```index.php```. The ```src``` folder contains all my php code, twig templates, etc. Obviously the ```src``` and ```public``` folders are very subjective in structure, but from what I have read and observed it is very common to follow such a structure. Within the ```src``` folder I use many controllers and namespaces. Again, I suppose you could eliminate many of these folders and condense the code into one or two namespaces.

#### Heroku Settings
To prepare for Heroku, you need to create a ```Procfile``` at the top of the folder structure with your ```composer.json``` and it should contain either an apache or nginx web line. I like apache so I need to use:

	web: vendor/bin/heroku-php-apache2 public/
	
#### Apache Settings
Also because I am using Apache, I can use ```.htaccess``` to handle URI rewrites. Therefore, I can simply add the following information in a ```.htaccess``` file in the ```public``` folder if it does not already exist:

	<IfModule mod_rewrite.c>
		RewriteEngine On
		# Some hosts may require you to use the `RewriteBase` directive.
		# Determine the RewriteBase automatically and set it as environment variable.
		# If you are using Apache aliases to do mass virtual hosting or installed the
		# project in a subdirectory, the base path will be prepended to allow proper
		# resolution of the index.php file and to redirect to the correct URI. It will
		# work in environments without path prefix as well, providing a safe, one-size
		# fits all solution. But as you do not need it in this case, you can comment
		# the following 2 lines to eliminate the overhead.
		RewriteCond %{REQUEST_URI}::$1 ^(/.+)/(.*)::\2$
		RewriteRule ^(.*) - [E=BASE:%1]

		# If the above doesn't work you might need to set the `RewriteBase` directive manually, it should be the
		# absolute physical path to the directory that contains this htaccess file.
		# RewriteBase /

		RewriteCond %{REQUEST_FILENAME} !-f
		RewriteRule ^ index.php [QSA,L]
	</IfModule>

The Apache documentation or [Slim documentation](http://www.slimframework.com/docs/v3/start/web-servers.html) covers this. 

#### The PHP Code ...
I also added an ```index.php``` into the ```public``` folder with the following code:

	<?php
	if (PHP_SAPI == 'cli-server') {
			// To help the built-in PHP dev server, check if the request was actually for
			// something which should probably be served as a static file
			$url = parse_url($_SERVER['REQUEST_URI']);
			$file = __DIR__ . $url['path'];
			if (is_file($file)) {
					return false;
			}
	}

	require __DIR__ . '/../vendor/autoload.php';

	// https://github.com/johnathanmiller/secure-env-php
	use SecureEnvPHP\SecureEnvPHP;

	if (getenv('APP_MODE') === 'Development') {
			(new SecureEnvPHP())->parse('.env.enc', '.env.key');
	}

	session_start();

	// Instantiate the app
	$settings = require __DIR__ . '/../src/settings.php';
	$app = new \Slim\App($settings);

	// Set up dependencies
	require __DIR__ . '/../src/dependencies.php';

	// Register middleware
	require __DIR__ . '/../src/middleware.php';

	// Register routes
	require __DIR__ . '/../src/routes.php';

	// Run app
	$app->run();


From this code you should be able to understand that I have required several php files from the ```src``` folder such as ```settings.php```, ```dependencies.php```, ```middleware.php```, and ```routes.php```. In addition, I have installed a package by  [Johnathan Miller](https://github.com/johnathanmiller/secure-env-php) called ```secure-env-php```. This package allows me to encrypt my ```.env``` file so that I may push an encrypted version of it to Github and Heroku. However, on Heroku, I do not use ```.env```, but rather environmental variables. I also use an environmental variable APP_MODE with an assigned value of ```Development``` or ```Production```.  For instance, locally I could initiate the development mode by running the following command in a terminal:
	
	export APP_MODE=Development; composer start

Now lets move towards the ```src``` folder. The ```settings.php``` file contains the following:

	<?php

	if (getenv('APP_MODE') === 'Production') {
			//Get Heroku ClearDB connection information
			$cleardb_url = parse_url(getenv("CLEARDB_DATABASE_URL"));
			$cleardb_server = $cleardb_url["host"];
			$cleardb_username = $cleardb_url["user"];
			$cleardb_password = $cleardb_url["pass"];
			$cleardb_db = substr($cleardb_url["path"], 1);
	}

	return [
			'settings' => [
					'displayErrorDetails' => getenv('APP_MODE') === 'Development' ? true : false, // set to false in production
					'addContentLengthHeader' => false, // Allow the web server to send the content-length header

					// Monolog settings
					'logger' => [
							'name' => 'jessequinn',
							'path' => getenv('APP_MODE') === 'Production' ? 'php://stdout' : __DIR__ . '/../logs/app.log',
							'level' => \Monolog\Logger::DEBUG,
					],

					'db' => [
							// Illuminate/database configuration
							'driver' => 'mysql',
							'host' => getenv('APP_MODE') === 'Development' ? getenv('DB_HOST') : $cleardb_server,
							'database' => getenv('APP_MODE') === 'Development' ? getenv('DB_DATABASE') : $cleardb_db,
							'username' => getenv('APP_MODE') === 'Development' ? getenv('DB_USERNAME') : $cleardb_username,
							'password' => getenv('APP_MODE') === 'Development' ? getenv('DB_PASSWORD') : $cleardb_password,
							'charset' => 'utf8',
							'collation' => 'utf8_unicode_ci',
							'prefix' => '',
					],

					'view' => [
							// TWIG configuration
							'template_path' => __DIR__ . '/Templates/',
							'twig' => [
									'cache' => __DIR__ . '/../cache/twig',
									'debug' => getenv('APP_MODE') === 'Development' ? true : false,
									'auto_reload' => getenv('APP_MODE') === 'Development' ? true : false, // development only
							],
					],
			],
	];

Now, I am sure there are many ways to write up the settings and if you have suggestions please post a comment. I use two databases, ClearDB for production and my local MySQL for development. I also use Monolog for logging and Illuminate for database interaction through ActiveRead style controllers. You will need to install these packages and others or simply add the following to your ```composer.json``` and run ```composer install``` to follow along with my project:

	"require": {
			"php": ">=5.5.0",
			"slim/slim": "^3.12",
			"monolog/monolog": "^1.17",
			"twig/twig": "^2.0",
			"slim/twig-view": "^2.4",
			"slim/csrf": "^0.8.3",
			"slim/flash": "^0.4.0",
			"vlucas/valitron": "^1.4",
			"illuminate/database": "^5.8",
			"akrabat/rka-slim-session-middleware": "^2.0",
			"johnathanmiller/secure-env-php": "^2.0",
			"aptoma/twig-markdown": "^3.0",
			"michelf/php-markdown": "^1.8",
			"league/commonmark": "^0.18.2",
			"twig/extensions": "^1.5"
	},
	
I will explain each package along the way.

to be continued ...
