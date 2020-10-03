---
title: Google Photos API and Photo Storage
description: Google Photos API how-to
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Google Photos API and Photo Storage
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Well what a learning process that was.... I am referring to my time spent working with the [Google API](https://developers.google.com/photos/library/guides/overview) for Google Photos. In my opinion it is just a mess. Long story short, I wanted a way to store images and Heroku was not an option. Of couse you can use S3 or some other paid service or may be even imgur. However, I like Google Photos, but in retrospect, may be I should have used some other service.

As previously stated, I wanted a way to store images and recall them for basic public use. Following along with the API documentation, specifically for PHP, I simply wanted to upload media. Well that being said, it was not so easy. Using some code from the samples, I was eventually able to connect to the Google API. Let's look at that code.

	use Google\Auth\Credentials\UserRefreshCredentials;
	use Google\Auth\OAuth2;
	use Google\Photos\Library\V1\PhotosLibraryClient;
	use Google\Photos\Library\V1\PhotosLibraryResourceFactory;
	use Google\Rpc\Code;

	public function ... {
		$clientSecretJson = json_decode(
				file_get_contents(__DIR__ . '/../../client_secret.json'),
				true
		)['web'];

		$clientId = $clientSecretJson['client_id'];
		$clientSecret = $clientSecretJson['client_secret'];
		$redirectURI = 'https://somesite/auth/google/callback';
		$scopes = [
				'https://www.googleapis.com/auth/photoslibrary',
				'https://www.googleapis.com/auth/photoslibrary.sharing'
		];

		$oauth2 = new OAuth2([
				'clientId' => $clientId,
				'clientSecret' => $clientSecret,
				'authorizationUri' => 'https://accounts.google.com/o/oauth2/v2/auth',
				// Where to return the user to if they accept your request to access their account.
				// You must authorize this URI in the Google API Console.
				'redirectUri' => $redirectURI,
				'tokenCredentialUri' => 'https://www.googleapis.com/oauth2/v4/token',
				'scope' => $scopes,
		]);
		
		... more code here ...
		
	}
	
So what we are doing here is accessing the ```client_secret.json``` file that is\was downloaded from the Google API credentials area. From this file I pull out the ```client_id``` and ```client_secret``` that I will pass to OAuth. I recommend putting this within the function/route that will make direct call to the API for access as a redirect is required that will send a ```code``` back to the same route. This route you need to add to the API credentials in the web application you created on the Google API site. It may even be advisable to use environmental variables rather than pulling information from a json file.

Next we need to capture the ```code``` that is sent back to you and your route, verify, and store credentials. 

	$code = $request->getQueryParam('code', $default = null);

	// The authorization URI will, upon redirecting, return a parameter called code.
	if ($code === null) {
			$authenticationUrl = $oauth2->buildFullAuthorizationUri(['access_type' => 'offline']);
			return $response->withHeader('Location', $authenticationUrl);

	} else {
			// With the code returned by the OAuth flow, we can retrieve the refresh token.
			$oauth2->setCode($code);
			$authToken = $oauth2->fetchAuthToken();
			$refreshToken = $authToken['access_token'];
			// The UserRefreshCredentials will use the refresh token to 'refresh' the credentials when
			// they expire.
			$session->set('credentials', new UserRefreshCredentials(
					$scopes,
					[
							'client_id' => $clientId,
							'client_secret' => $clientSecret,
							'refresh_token' => $refreshToken
					]
			));

			return $response->withRedirect($this->router->pathFor('somesiteurl'));

If no ```code``` exists you will be sent to the authentication URL to sign in. Once signed in, the route you setup previous, ```$redirectURI```, should return with a ```?code=someverylongalphanumericvalue``` appended. Once we have that ```code``` we can pass the ```setCode()``` function the ```code``` that will be use to provide the refresh token value that we store with the client id and client secret in a session. I use a special class for storing session data so it should look different for you.

So now we have setup the code for loggin into the Google API, I wanted to upload an image.

	$photosLibraryClient = new PhotosLibraryClient(['credentials' => $session->credentials]);
	
	$uploadToken = $photosLibraryClient->upload(
			file_get_contents($uploadedFile->file),
			$filename
	);

	$listAlbumsResponse = $photosLibraryClient->listAlbums();
	
	foreach ($listAlbumsResponse->iterateAllElements() as $album) {
			if ($album->getTitle() === 'somealbumname') {
					$albumId = $album->getId();
					$albumExists = true;
					break;
			}
	}

	if (!$albumExists) {
			$newAlbum = PhotosLibraryResourceFactory::album('somealbumname');
			$createdAlbumResponse = $photosLibraryClient->createAlbum($newAlbum);
			$albumId = $createdAlbumResponse->getId();
	}

	$itemDescription = 'new post photo ' . $filename;
	$newMediaItems[] = PhotosLibraryResourceFactory::newMediaItemWithDescription($uploadToken, $itemDescription);
	$batchCreateResponse = $photosLibraryClient->batchCreateMediaItems($newMediaItems, [
			'albumId' => $albumId
	]);

	foreach ($batchCreateResponse->getNewMediaItemResults() as $itemResult) {
			$status = $itemResult->getStatus();
			if ($status->getCode() != Code::OK) {
					$this->flash->addMessage('error', 'Error with photo item being created.');
					return $response->withRedirect($this->router->pathFor('admin-edit-post-form',
							[
									'id' => $post_data['post_id'],
							]));
			} else {
					$mediaItem = $itemResult->getMediaItem();
					$id = $mediaItem->getId();
					$item = $photosLibraryClient->getMediaItem($id);
					$baseUrl = $item->getBaseUrl();
					$filename = $baseUrl;
			}
	}

So we have a long piece of code here. We begin by making a new instance of ```PhotosLibraryClient``` and pass the constructor with the session credentials. Next we need to make an upload token that contains the file contents and filename as parameters. Because, from my experience, we cannot work with albums that already exist, we need to first create one. Once created, we can continuously use it. Odd? I thought so. Apparently, unless i am using the wrong scope, we cannot access an already created album that is shared. Nonetheless, we can validate each time if the album exists or not. If it does not create it. Next, we make a new media item by passing the upload token and item description to the ```newMediaItemWithDescription()``` function and then call the ```batchCreateMediaItems()``` with the item and the ```albumId```. Done, you should have uploaded the new media item. We can subsequently validate the item with the ```getNewMediaItemResults()``` in a foreach. I am assuming we would upload many photos. I believe up to 50 at one time are allowed. If the item is ok, I want to access the ```baseUrl``` for public usage. This is another quark, I thought that I would be able to use the ```itemResult``` as it does have a ```baseUrl```, but it is empty. Therefore, i need to call the ```getMediaItem()``` with the id of the newly created item to obtain the ```baseUrl```. You can store the ```baseUrl``` in a file or database to dynamically add to your site for a source to your images.

The end.
