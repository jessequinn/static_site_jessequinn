---
title: PyQt5 Programming
description: PyQt5 is a pretty sweet set of Python bindings for Qt application framework that is comprised of numerous useful components
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: PyQt5 Programming
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

**You can now find my releases and source code [here](https://github.com/jessequinn/tagger)**

I have to say I have really enjoyed working with [PyQt5](https://www.riverbankcomputing.com/static/Docs/PyQt5/introduction.html) and Designer versus Tk. Anyhow, my mission was to create a PyQt5 based application for movie/tv show meta-tagging because, as it stands, linux lacks any, atleast in my opinion. 

To being working with PyQt5, I needed to install some packages on Manjaro. I highly recommend using the package builder pyinstaller and [fbs](https://pypi.org/project/fbs/); for this we will need to compile a shared libraries version of Python. This is accomplished by prefixing the ```pyenv install version``` with ```CONFIGURE_OPTS=--enabled-shared```.  This is required as ```pyinstaller``` requires shared libraries.
	
	CONFIGURE_OPTS=--enable-shared pyenv install 3.6.8

Now we can safely install ```fbs``` and ```pyInstaller```
	
	pip install fbs PyInstaller
	
I am a fan of [pyenv](https://github.com/pyenv/pyenv), [pyenv-virtualenv](https://github.com/pyenv/pyenv-virtualenv), etc. as I work with several versions of Python. I wanted to install ```fbs``` as it allows me to wrap my development into a system that I can easily compile to produce a binary for execution elsewhere. There are other packages I needed as well so I will provide a copy of my ```pip freeze```:

	altgraph==0.16.1
	asn1crypto==0.24.0
	astroid==2.2.5
	boto3==1.9.129
	botocore==1.12.129
	certifi==2018.11.29
	cffi==1.12.2
	chardet==3.0.4
	Click==7.0
	coverage==4.5.3
	cryptography==2.6.1
	docutils==0.14
	fbs==0.7.3
	future==0.17.1
	idna==2.8
	isort==4.3.17
	jmespath==0.9.4
	lazy-object-proxy==1.3.1
	macholib==1.11
	mccabe==0.6.1
	mock==2.0.0
	mutagen==1.42.0
	nose==1.3.7
	pbr==5.1.3
	pefile==2018.8.8
	pyAesCrypt==0.4.2
	pycparser==2.19
	PyInstaller==3.4
	pylint==2.3.1
	PyQt5==5.12.1
	PyQt5-sip==4.19.15
	PyQt5-stubs==5.12.1.0
	python-dateutil==2.8.0
	python-dotenv==0.10.1
	requests==2.21.0
	requests-cache==0.4.13
	s3transfer==0.2.0
	six==1.12.0
	tmdbv3api==1.3.2
	typed-ast==1.3.1
	urllib3==1.24.1
	wrapt==1.11.1

Of course from this list the must have is ```pyqt5 pyqt5-sip pyqt5-stub``` and chances are some other packages I do not need like ```Click``` as I am actually converting over a script I wrote around Click, a CLI interface, to PyQt5. Finally, a userful application is Designer for Qt, which I installed via ```pacman``` on Manjaro. Lastly, you will need an API key from [TMDB](https://developers.themoviedb.org/3/getting-started/introduction).

The folder structure of my app is as such:
	
	.
	├── src
	│   ├── build
	│   │   └── settings
	│   └── main
	│       ├── icons
	│       │   ├── base
	│       │   ├── linux
	│       │   └── mac
	│       └── python
	│           └── ui
	└── tests

In the main folder exists a ```main.py``` file that contains my application. However, I will begin by talking about some important Classes.

An important and simple Class I created uses [Mutagen](https://mutagen.readthedocs.io/en/latest/index.html) for manipulating mp4 meta tag data. I stick to the semantics for [iTunes ](https://code.google.com/archive/p/mp4v2/wikis/iTunesMetadata.wiki#Media_Type_(stik)).

The following is a gist of that Class:

<script src="https://gist.github.com/jessequinn/591a8cae7990669a66b4f4435174f8fe.js"></script>

The following gist contains three Classes, two of which are inherited from the base MetaTag Class. Essentially, I use these Classes to either meta tag a movie or a show. They will be instantiated within my application for each new movie or show that requires meta tagging. I pass several parameters such as title, description, etc in the constructors.

to be continued ...
