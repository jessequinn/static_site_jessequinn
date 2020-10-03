---
title: I See the Truth Now!!! Imgur API
description: An update to my original Google API post. I discuss the use of Imgur API and PHP.
img: phil-hauser-zlOjvMDN498-unsplash.jpg
alt: I See the Truth Now!!! Imgur API
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Well well.. as predicted.. I needed to move APIs. Essentially Google Photos API baseurl keeps changing which means that you do not have a static public url for your images. Well, goodbye Google and hello [Imgur](https://apidocs.imgur.com/#intro). 

To access the Imgur API you will need to sign up for a basic account along with a developer API. Like the Google API, you will use OAuth2 to access your content. Once signed up, you should have a ```client id``` and ```client secret``` for your callback url. A really nice PHP based api wrapper exists [php-imgur-api-client](https://github.com/j0k3r/php-imgur-api-client) that follows the available API endpoints. Here I provide an example function to work with the API wrapper:

	private function uploadImage($filename, $uploadedFile, $session)
	{
		$client = new Imgur\Client();
		$client->setAccessToken($session->refresh_token);
		$listAlbumsResponse = $client->api('account')->albums();

		foreach ($listAlbumsResponse as $key => $jsons) {
			foreach ($jsons as $key => $value) {
				if ($key === 'id') {
					$albumId = $value;
				}

				if ($key === 'title' and $value === 'jessequinninfo') {
					$albumExists = true;
					break;
				}
			}
		}

		if (!$albumExists) {
			$createAlbumResponse = $client->api('album')->create([
				'title' => 'jessequinninfo',
				'description' => 'album for jessequinn.info',
				'privacy' => 'public',
			]);

			foreach ($createAlbumResponse as $key => $value) {
				if ($key === 'id') {
					$albumId = $value;
				}
			}
		}

		$uploadPhotoResponse = $client->api('image')->upload([
			'image' => base64_encode(file_get_contents($uploadedFile->file)),
			'type' => 'base64',
			'album' => $albumId,
			'title' => 'blog image',
			'description' => 'new post photo for blog',
		]);

		foreach ($uploadPhotoResponse as $key => $value) {
			if ($key === 'link') {
				$filename = $value;
			}

			if ($key === 'deletehash') {
				$deletehash = $value;
			}
		}

		return $filename .= ', ' . $deletehash;
	}
	
I grab my token from my session variable, grab a list of albums, keep the id, and find the title that matches my album name. I do not want to create duplicates, so i have the create album within an if statement. Next I upload an image with the ```$albumId``` and finally i check and keep the link and deletehash. 

To connect to Imgur I simply do the following:

	public function connectWithImgur(Request $request, Response $response, $args)
	{
		$session = new RKA\Session();

		if ($session->user_role == 'Admin') {
			$client = new Imgur\Client();
			$client->setOption('client_id', getenv('SOMEENVVARIABLE'));
			$client->setOption('client_secret', getenv('SOMEENVVARIABLE'));

			if (isset($session->refresh_token)) {
				$client->setAccessToken($session->refresh_token);

				if ($client->checkAccessTokenExpired()) {
					$client->refreshToken();
				}

				return $response->withRedirect($this->router->pathFor('admin-list-posts'));
			} elseif ($request->getQueryParam('code', $default = null) != null) {
				$client->requestAccessToken($request->getQueryParam('code'));
				$session->refresh_token = $client->getAccessToken();
			} else {
				return $response->withHeader('Location', $client->getAuthenticationUrl());
			}
		}

		return $response->withRedirect($this->router->pathFor('blog-list-posts'));
	}
	
In retrospect, Imgur is far superior than Google Photos as you can delete images!!!

	$client = new Imgur\Client();
	$client->setAccessToken($session->refresh_token);
	$pieces = explode(',', $post_delete['post_img']);
	$client->api('image')->deleteImage(ltrim($pieces[1]));
	
I hope this helps someone and please stay away from Google Photos API.
