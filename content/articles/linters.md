---
title: Working with Linters, Fixers, Hooks for Github, etc.
description: A short discussion of linters, fixers, etc. that I use for web development.
img: chunlea-ju-8fs1X0JFgFE-unsplash.jpg
alt: Working with Linters, Fixers, Hooks for Github, etc.
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

I just want to briefly discuss several packages that I use for maintaining web development projects. 

First I want to talk about the [Husky](https://github.com/typicode/husky) package. Most, if not everyone, that works with software/web development has come across Github or some sort of version control system (VCS). Well Husky offers a very useful way of simply accessing all sorts of hooks for Git. For instance, I can place a ```pre-commit``` option under ```hooks``` in my ```package.json``` file that includes a call to a script, cmd, or whatever. Hang on, just hang on, I just skipped over all sorts of information.

What is a hook? Why do we want such an option? The list of questions goes on... Well simply put a hook is an action that occurs when adding, comitting, pushing, etc. to a VCS. I would want this option, for instance, to run a linter, something that will clean up my code, or even, fix it. Although, the list of reasons are numerous, this is my primary reason for playing around with hooks. 

Before getting into installations and configurations for Husky, Prettier (a linter), and php-cs-fixer (php code fixer), we need to install nodejs. I am using Manjaro, so I can quickly install nodejs through the AUR Archlinux Repository with the ```nvm`` package.

Once installed we need to update our .bashrc.

	echo 'source /usr/share/nvm/init-nvm.sh' >> ~/.bashrc

Now lets install nodejs using ```nvm``` along with ```yarn```:

	nvm install 10.15.3 # as an example
	npm install -g yarn
	echo 'export PATH=$PATH:~/.yarn/bin' >> ~/.bashrc

Obviously, this process is different for Windows. OSX users could easily install via Homebrew.

With npm/yarn installed we can now begin by installing some npm packages. 

	yarn add lint-staged husky prettier --dev

This command will add several packages to our ```devDependencies``` found in the ```package.json```.

Now lets add a hook for lint-staged.

	{
		"husky": {
			"hooks": {
				"pre-commit": "lint-staged"
			}
		},
		"lint-staged": {
			"*.{js,json,css,md}": ["prettier --write", "git add"]
		}
	}

So what have i done? Firstly, I have installed the husky package. This will run a script in the background that will prepare your ```.git/hooks/**scripts**```. Lastly, I have added a hook known as ```pre-commit``` to the ```package.json``` that will call ```lint-staged```. ```lint-staged``` actually calls ```prettier```, an opinionated code formatter, for js, css, json, yaml, etc. and then the command ```git add```. So every time I run ```git commit``` the ```pre-commit``` hook will be called that runs ```prettier``` on any js, json, css, md file and then readds them for the final commit. 

We can customize this further, as an example:

	"scripts": {
		"format-css-js": "prettier --write --config .prettierrc 'public/**/*.{css,js,vue}'",
		"format-php": "prettier --write --config .prettierrc-php 'public/**/*.php' 'src/**/*.php'"
	},
	"husky": {
		"hooks": {
			"pre-commit": "lint-staged",
			"commit-msg": "commitlint --edit $HUSKY_GIT_PARAMS"
		}
	},
	"lint-staged": {
		"*.php": [
			"npm run format-php",
			"git add"
		]
	}

With this code I am using the ```@prettier/plugin-php``` plugin, which will format PHP code. ** Currently there is a bug ** that causes all ```trailingComma``` to fail unless it uses specifically an option that exists for the plugin. For instance, I use a ```.prettierrc``` configuration file that looks like

	{
		"printWidth": 100,
		"singleQuote": true,
		"tabWidth": 4,
		"trailingComma": "es5"
	}

This will fail because the ```trailingComma``` is set to ```es5```. Therefore, I use a separate configuration file specifically for PHP that looks like

	{
		"printWidth": 100,
		"singleQuote": true,
		"tabWidth": 4,
		"trailingComma": "php7.2",
		"braceStyle": "psr-2"
	}
	
In future I will use ```overrides``` as described in the prettier documentation; however, as stated previously, this bug exists and overrides do not fix it.

I also use ```friendsofphp/php-cs-fixer``` package for PHP code formatting and alteration. However, this package must be installed via ```composer```:

	composer require friendsofphp/php-cs-fixer --dev
	
This package requires a ```.php_cs``` file and mine looks like

	<?php

	$finder = Symfony\Component\Finder\Finder::create()
			->notPath('vendor')
			->notPath('cache')
			->notPath('logs')
			->notPath('tests')
			->in(__DIR__)
			->name(['*.php','*.twig']);

	return PhpCsFixer\Config::create()
			->setRules([
					'@PSR2' => true,
					'array_syntax' => ['syntax' => 'short'],
					'ordered_imports' => ['sortAlgorithm' => 'alpha'],
					'no_unused_imports' => true,
					'no_useless_else' => true,
					'no_useless_return' => true,
					'blank_line_after_namespace' => true,
					'elseif' => true,
					'encoding' => true,
			])
			->setFinder($finder);

Essentially I ignore several paths and use only ```.php``` and ```.twig``` files for code formatting and alteration. I also set rules for ```php-cs-fixer``` here. Under scripts in the ```composer.json``` file I have added

    "scripts": {
		"format": [
            "vendor/bin/php-cs-fixer fix"
        ]
	}

This script now allows me to simply run

	composer format

Now I can add this to the ```pre-commit``` hook in the ```package.json``` file

	"lint-staged": {
		"*.php": [
			"npm run format-php",
			"composer format",
			"git add"
		]
	}

In general, I find this method of cleaning up code prior to a commit very useful. To go even further, I have implemented a commit linter. 

	npm install @commitlint/cli @commitlint/config-conventional --save-dev
	echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
	
This package enforces a more semantic meaning to your git history.

All in all, I really appreciate npm and composer package mangers and the many packages available for programmers to use.
