---
title: LAMP Installation on Manjaro
description: A walk-through on how to configure Linux, Apache, MariaDB, and PHP (LAMP) for development or production purposes.
img: markus-spiske-466ENaLuhLY-unsplash.jpg
alt: LAMP Installation on Manjaro
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

#### Introduction
A LAMP configuration is a linux distro setup to use Apache, a well known and popular httpd, a SQL server such as MariaDB or Mysql, and a scripting language like PHP, Python or Perl; thus forming the acronym LAMP. However, a LAMP server could in fact use Nginx or another httpd server or Postresql or many other databases. 

#### Installation
The following is based on [here](https://www.ostechnix.com/install-apache-mariadb-php-lamp-stack-on-arch-linux-2016/).

On Manjaro/Archlinux it is always advisable to run:
	
	sudo pacman -Syu
	sudo pacman -S apache php php-apache mysql
	
to update your system with current software and install the required packages. You should be prompted with two database options. Select  ```mariadb```.

##### Apache
Edit the Apache configuration file and comment out the following line if it is not already:
:

	sudo nano /etc/httpd/conf/httpd.conf
	# LoadModule unique_id_module modules/mod_unique_id.so

Enable and start the Apache service with systemd:

	sudo systemctl enable httpd
	sudo systemctl start httpd

Verify the status:

	sudo systemctl status httpd
	sudo journalctl -xe

Create a test index.html with the following html:

	sudo nano /srv/http/index.html
	<html>
	<head>
		<title>Hello World</title>
	</head>
	<body>
		<h2>Hello World</h2>
	</body>
	</html>

Visit your localhost in your favourite browser http://localhost or http://localipaddress to confirm you receive ```Hello World```.

##### MariaDB
Initialize the database with:

	sudo mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
	
like Apache we need to use systemd to load the MariaDB service permanently

	sudo systemctl enable mysqld
	sudo systemctl start mysqld
	
Check the status of the service

	sudo systemctl status mysqld
	sudo journalctl -xe

run the following script to setup the root user

	sudo mysql_secure_installation

##### PHP
Revisit the Apache configuration file:

	sudo nano /etc/httpd/conf/httpd.conf

and comment out the ```mod_mpm_event``` and either add or uncomment the following:

	#LoadModule mpm_event_module modules/mod_mpm_event.so
	LoadModule mpm_prefork_module modules/mod_mpm_prefork.so
	LoadModule php7_module modules/libphp7.so
	AddHandler php7-script php
	Include conf/extra/php7_module.conf

Create a test for php:

	sudo nano /srv/http/test.php
	<?php
		phpinfo();

Restart Apache and vist http://localhost/test.php

	sudo systemctl restart httpd

You are done. You can either use phpMyAdmin or your IDE such as phpstorm/datagrip from [JetBrains](https://www.jetbrains.com/) to interact with your database. I personally opt to use my IDE.

##### phpMyAdmin

Install phpMyAdmin:

	sudo pacman -S phpmyadmin

Edit the ```php.ini``` file and uncomment the following:

	sudo nano /etc/php/php.ini
	extension=bz2.so
	extension=mysqli.so

We need to map phpMyAdmin to an url with Apache:

	sudo nano /etc/httpd/conf/extra/phpmyadmin.conf
	Alias /phpmyadmin "/usr/share/webapps/phpMyAdmin"
	<Directory "/usr/share/webapps/phpMyAdmin">
		DirectoryIndex index.php
		AllowOverride All
		Options FollowSymlinks
		Require all granted
	</Directory>

and include the configuration to the Apache configuration file:

	sudo nano /etc/httpd/conf/httpd.conf
	Include conf/extra/phpmyadmin.conf
	
We need to also edit the phpMyAdmin configuration file and restart the Apache service:

	sudo nano /etc/webapps/phpmyadmin/config.inc.php
	$cfg['blowfish_secret'] = '`somesecrethere`';
	sudo systemctl restart httpd
