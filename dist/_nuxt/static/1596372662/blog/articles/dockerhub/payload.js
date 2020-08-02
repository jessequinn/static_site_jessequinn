__NUXT_JSONP__("/blog/articles/dockerhub", (function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u){return {data:[{article:{title:r,description:"Just a quick tutorial on how to push Dockerfiles",img:"joao-tzanno-G9_Euqxpu4k-unsplash.jpg",alt:r,featured:0,author:{name:"Jesse Quinn",bio:"All about Jesse",img:"https:\u002F\u002Fimages.unsplash.com\u002Fphoto-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80",alt:"profile photo"},publishedAt:"2020-01-05T03:00:00.000Z",updateAt:k,toc:[],body:{type:"root",children:[{type:b,tag:e,props:{},children:[{type:a,value:"I have been recently studying "},{type:b,tag:l,props:{href:"https:\u002F\u002Fkubernetes.io\u002F",rel:[m,n,o],target:p},children:[{type:a,value:"Kubernetes"}]},{type:a,value:" to possibly move away from just Dockerizing directly. To gain some experience and knowledge, I have been following an excellent article on "},{type:b,tag:l,props:{href:"https:\u002F\u002Fitnext.io\u002Fcontainerizing-symfony-application-a2a5a3bd5edc",rel:[m,n,o],target:p},children:[{type:a,value:"itnext"}]},{type:a,value:". However, I ran into some issues, or rather the ability to properly reproduce some of the assumed tasks in the article. Nonetheless, I came through, and wanted to disseminate some of the information I have gathered."}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:"If, like me, you are interested in pushing your "},{type:b,tag:c,props:{},children:[{type:a,value:"Dockerfiles"}]},{type:a,value:" to a public\u002Fprivate repo such as "},{type:b,tag:l,props:{href:"https:\u002F\u002Fhub.docker.com\u002Frepositories",rel:[m,n,o],target:p},children:[{type:a,value:"docker"}]},{type:a,value:" then the following "},{type:b,tag:c,props:{},children:[{type:a,value:"Makefile"}]},{type:a,value:" may be of interest. For instance, you have three images you have made, in my case, "},{type:b,tag:c,props:{},children:[{type:a,value:s}]},{type:a,value:", "},{type:b,tag:c,props:{},children:[{type:a,value:t}]},{type:a,value:" and "},{type:b,tag:c,props:{},children:[{type:a,value:u}]},{type:a,value:" for a symfony project, "}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:q},{type:b,tag:c,props:{},children:[{type:a,value:s}]}]},{type:a,value:d},{type:b,tag:f,props:{className:[g]},children:[{type:b,tag:h,props:{className:[i,j]},children:[{type:b,tag:c,props:{},children:[{type:a,value:"ARG VERSION\n\nFROM mysql:${VERSION} as prod\n\n# Copy sql dump to initialize tables on stratup\nCOPY .\u002Fdocker\u002Fmysql\u002Finit \u002Fdocker-entrypoint-initdb.d\n"}]}]}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:q},{type:b,tag:c,props:{},children:[{type:a,value:u}]}]},{type:a,value:d},{type:b,tag:f,props:{className:[g]},children:[{type:b,tag:h,props:{className:[i,j]},children:[{type:b,tag:c,props:{},children:[{type:a,value:"ARG VERSION\n\n# Dev image\nFROM nginx:${VERSION}-alpine as dev\n\n# Copy nginx config\nCOPY .\u002Fdocker\u002Fnginx\u002Fdefault.conf \u002Fetc\u002Fnginx\u002Fconf.d\u002Fdefault.conf\n\n# Prod image\nFROM dev as prod\n\n# Copy assets\nCOPY .\u002Fassets \u002Fapp\u002Fpublic\n"}]}]}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:q},{type:b,tag:c,props:{},children:[{type:a,value:t}]}]},{type:a,value:d},{type:b,tag:f,props:{className:[g]},children:[{type:b,tag:h,props:{className:[i,j]},children:[{type:b,tag:c,props:{},children:[{type:a,value:"ARG VERSION\n\n\n# Build image\nFROM php:${VERSION}-fpm-alpine AS build\n\n## Install system dependencies\nRUN apk update && \\\n    apk add --no-cache zlib-dev libzip-dev\n\n## Install php extensions\nRUN docker-php-ext-install pdo_mysql zip\n\n## Copy php default configuration\nCOPY .\u002Fdocker\u002Fphp-fpm\u002Fdefault.ini \u002Fusr\u002Flocal\u002Fetc\u002Fphp\u002Fconf.d\u002Fdefault.ini\n\n## Install composer\nRUN wget https:\u002F\u002Fgetcomposer.org\u002Finstaller && \\\n    php installer --install-dir=\u002Fusr\u002Flocal\u002Fbin\u002F --filename=composer && \\\n    rm installer && \\\n    composer global require hirak\u002Fprestissimo\n\n\n# Dev image\nFROM build AS dev\n\n## Install system dependencies\nRUN apk add --no-cache git autoconf gcc g++ make\n\n## Install php extensions\nRUN pecl install xdebug && \\\n    docker-php-ext-enable xdebug\n\n\n# Test image\nFROM dev AS test\n\nENV APP_ENV=dev\nWORKDIR \u002Fapp\n\n## Copy project files to workdir\nCOPY . .\n\n## Install application dependencies\nRUN composer install --no-interaction --optimize-autoloader\n\n## Change files owner to php-fpm default user\nRUN chown -R www-data:www-data .\n\nCMD [\"php-fpm\"]\n\n\n# Prod image\nFROM build AS prod\n\nENV APP_ENV=prod\nWORKDIR \u002Fapp\n\n## Copy project files to workdir\nCOPY . .\n\n## Remove dev dependencies\nRUN composer install --no-dev --no-interaction --optimize-autoloader\n\n## Change files owner to php-fpm default user\nRUN chown -R www-data:www-data .\n\n## Cleanup\n#RUN rm \u002Fusr\u002Flocal\u002Fbin\u002Fcomposer\n\nCMD [\"php-fpm\"]\n"}]}]}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:"You could simply type "},{type:b,tag:c,props:{},children:[{type:a,value:"export DOCKER_USER=username DOCKER_PASS=password; make build TYPE=mysql"}]},{type:a,value:" to build, tag and finally push to the repo. In general, I build the image with prod, though,  dev,  test or another build type could be used as well. Thereafter, I tag with the current commit short form and as well with latest. This way, under tags, a new tag will be created along with an update to the latest. I then log in and push the newly built and tagged images. You can see what it is doing by using "},{type:b,tag:c,props:{},children:[{type:a,value:"docker images"}]},{type:a,value:". Although, I believe the code is self-explanatory. However, if you have an issues, you may leave a message."}]},{type:a,value:d},{type:b,tag:f,props:{className:[g]},children:[{type:b,tag:h,props:{className:[i,j]},children:[{type:b,tag:c,props:{},children:[{type:a,value:"TAG             := $$(git rev-parse --short HEAD)\n\nNAME_MYSQL      := symfony-dummy-project-mysql\nIMG_MYSQL       := ${NAME_MYSQL}:${TAG}\nLATEST_MYSQL    := ${NAME_MYSQL}:latest\nVERSION_MYSQL   := 5.7\n\nNAME_NGINX      := symfony-dummy-project-nginx\nIMG_NGINX       := ${NAME_NGINX}:${TAG}\nLATEST_NGINX    := ${NAME_NGINX}:latest\nVERSION_NGINX   := 1.15\n\nNAME_PHP_FPM    := symfony-dummy-project-php-fpm\nIMG_PHP_FPM     := ${NAME_PHP_FPM}:${TAG}\nLATEST_PHP_FPM  := ${NAME_PHP_FPM}:latest\nVERSION_PHP_FPM := 7.3\n\nifeq ($(TYPE),mysql)\nbuild:\n    @docker build --build-arg VERSION=${VERSION_MYSQL} --target prod -t ${NAME_MYSQL}:prod -f docker\u002Fmysql\u002FDockerfile  .\n    @docker tag ${NAME_MYSQL}:prod damasu\u002F${IMG_MYSQL}\n    @docker tag ${NAME_MYSQL}:prod damasu\u002F${LATEST_MYSQL}\n    @docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}\n    @docker push damasu\u002F${IMG_MYSQL}\n    @docker push damasu\u002F${LATEST_MYSQL}\nelse ifeq ($(TYPE),nginx)\nbuild:\n    @docker build --build-arg VERSION=${VERSION_NGINX} --target prod -t ${NAME_NGINX}:prod -f docker\u002Fnginx\u002FDockerfile  .\n    @docker tag ${NAME_NGINX}:prod damasu\u002F${IMG_NGINX}\n    @docker tag ${NAME_NGINX}:prod damasu\u002F${LATEST_NGINX}\n    @docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}\n    @docker push damasu\u002F${IMG_NGINX}\n    @docker push damasu\u002F${LATEST_NGINX}\nelse ifeq ($(TYPE),php)\nbuild:\n    @docker build --build-arg VERSION=${VERSION_PHP_FPM} --target prod -t ${NAME_PHP_FPM}:prod -f docker\u002Fphp-fpm\u002FDockerfile  .\n    @docker tag ${NAME_PHP_FPM}:prod damasu\u002F${IMG_PHP_FPM}\n    @docker tag ${NAME_PHP_FPM}:prod damasu\u002F${LATEST_PHP_FPM}\n    @docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}\n    @docker push damasu\u002F${IMG_PHP_FPM}\n    @docker push damasu\u002F${LATEST_PHP_FPM}\nendif\n"}]}]}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:"PS."}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:"I use this rather than using automated build. If one wanted to use automated builds you would require to make a "},{type:b,tag:c,props:{},children:[{type:a,value:"hooks\u002Fbuild"}]},{type:a,value:" file in the same directory as your Dockerfile(s). "}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:"The "},{type:b,tag:c,props:{},children:[{type:a,value:"build"}]},{type:a,value:" file could contain something like"}]},{type:a,value:d},{type:b,tag:f,props:{className:[g]},children:[{type:b,tag:h,props:{className:[i,j]},children:[{type:b,tag:c,props:{},children:[{type:a,value:"#!\u002Fbin\u002Fsh\ndocker build --build-arg VERSION=$VERSION -t $IMAGE_NAME .\n"}]}]}]},{type:a,value:d},{type:b,tag:e,props:{},children:[{type:a,value:"where you pass a "},{type:b,tag:c,props:{},children:[{type:a,value:"BUILD ENVIRONMENT VARIABLE"}]},{type:a,value:" - "},{type:b,tag:c,props:{},children:[{type:a,value:"$VERSION"}]},{type:a,value:" possibly a target, if you're using a multistage Dockerfile, etc. However, the challenge with this method is correctly using your context especially if you require "},{type:b,tag:c,props:{},children:[{type:a,value:"COPY"}]},{type:a,value:" in your Dockerfile(s)."}]}]},dir:"\u002Farticles",path:"\u002Farticles\u002Fdockerhub",extension:".md",slug:"dockerhub",createdAt:"2020-07-22T00:27:09.719Z",updatedAt:"2020-07-22T00:27:38.787Z"},prev:{title:"New publication",updateAt:k,slug:"nrc-publication"},next:{title:"Micro Kong",updateAt:k,slug:"kong-micro"}}],fetch:[],mutations:[]}}("text","element","code","\n","p","div","nuxt-content-highlight","pre","language-text","line-numbers","2020-07-19T03:00:00.000Z","a","nofollow","noopener","noreferrer","_blank","The Dockerfile for ","Pushing Dockerfiles","mysql","php-fpm","nginx")));