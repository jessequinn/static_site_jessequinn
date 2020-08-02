---
title: Highlight.js and Webpack-encore
description: Just another quick tutorial on installing Highlight.js with  Webpack-encore - Symfony
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Highlight.js and Webpack-encore
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-11-09T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

I wanted to use [Highlight.js](https://highlightjs.org/) to beautify my pre - codes. In the past, I used Hightlight.js and liked the eyecandy; therefore, I decided to reincorporate into my current site. To do so with Symfony  Webpack-encore is quite simple:

```bash
#install the dependency
yarn add highlight.js

#select a style
cat  "@import '~highlight.js/styles/tomorrow-night.css';" > assets/css/articles.scss

cat "require('../css/articles.scss');
const hljs = require("highlight.js/lib/highlight.js");
hljs.initHighlightingOnLoad();" > assets/js/articles.js
```

Now add an entry into your `webpack.config.js`

```javascript
Encore
//
    .addEntry('articles', './assets/js/articles.js')
//
```

```bash
#build your assets
yarn run watch
```

Finally incorporate the new `JS` and `CSS` into your `twig` template etc..

```twig
{% block stylesheets %}
    {{ parent() }}
    {{ encore_entry_link_tags('articles') }}
    {{ encore_entry_script_tags('articles') }}
{% endblock %}
```

That's all.. quite simple!
