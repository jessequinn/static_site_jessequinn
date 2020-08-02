__NUXT_JSONP__("/blog/articles/kong-micro", (function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W){return {data:[{article:{title:F,description:"I discuss recent work with Kong, an API gateway, and Micro, a Golang framework for rapid development of microservices.",img:"joao-tzanno-G9_Euqxpu4k-unsplash.jpg",alt:F,featured:0,author:{name:"Jesse Quinn",bio:"All about Jesse",img:"https:\u002F\u002Fimages.unsplash.com\u002Fphoto-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80",alt:"profile photo"},publishedAt:"2020-01-19T03:00:00.000Z",updateAt:v,toc:[],body:{type:"root",children:[{type:b,tag:w,props:{},children:[{type:a,value:"Recently, I had the joy of putting together an environment for an API. I wanted to do things differently and securely. To do so, I decided to utilize Kong as an API gateway to the "},{type:b,tag:"a",props:{href:"https:\u002F\u002Fmicro.mu\u002F",rel:["nofollow","noopener","noreferrer"],target:"_blank"},children:[{type:a,value:"micro.mu"}]},{type:a,value:" API gateway. To get a better idea, I have implemented a structure like "},{type:b,tag:f,props:{},children:[{type:a,value:"Nginx (reverse proxy) -\u003E Kong (gateway)-\u003E Micro API (gateway) -\u003E APIs -\u003E Services -\u003E Database(s)"}]},{type:a,value:". To accomplish this system, using Docker-compose, I did the following:"}]},{type:a,value:n},{type:b,tag:G,props:{className:[H]},children:[{type:b,tag:I,props:{className:[J,"language-text"]},children:[{type:b,tag:f,props:{},children:[{type:a,value:"version: '3.7'\n\nservices:\n    #######################################\n    # Etcd: Discovery service\n    #######################################\n    etcd:\n        image: bitnami\u002Fetcd:latest\n        ports:\n            - \"2379:2379\"\n            - \"2380:2380\"\n        environment:\n            ALLOW_NONE_AUTHENTICATION: \"yes\"\n            ETCD_ADVERTISE_CLIENT_URLS: http:\u002F\u002Fetcd:2379\n        restart: unless-stopped\n\n    #######################################\n    # Microapi: The API gateway for micro\n    #######################################\n    microapi:\n        image: microhq\u002Fmicro:latest\n        command: \"--registry=etcd --registry_address=etcd:2379 api --handler=http\"\n        depends_on:\n            - etcd\n        ports:\n            - 8080:8080\n        restart: unless-stopped\n\n    #######################################\n    # Nginx: Proxy\n    #######################################\n    nginx-proxy:\n        restart: unless-stopped\n        image: jwilder\u002Fnginx-proxy\n        ports:\n            - \"80:80\"\n            - \"443:443\"\n        security_opt:\n            - label:type:docker_t\n        volumes:\n            - .\u002Fdocker\u002Fpublic:\u002Fusr\u002Fshare\u002Fnginx\u002Fhtml\n            - .\u002Fdocker\u002Fcerts:\u002Fetc\u002Fnginx\u002Fcerts:ro\n            - vhost:\u002Fetc\u002Fnginx\u002Fvhost.d\n            - \u002Fvar\u002Frun\u002Fdocker.sock:\u002Ftmp\u002Fdocker.sock:ro\n        labels:\n            com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy: \"true\"\n        depends_on:\n            - kong\n\n    #######################################\n    # Kong: Database migration\n    #######################################\n    kong-migration:\n        image: kong:1.4.3-alpine\n        command: \"kong migrations bootstrap\"\n        restart: on-failure\n        environment:\n            KONG_DATABASE: postgres\n            KONG_PG_DATABASE: kong\n            KONG_PG_HOST: microapi-database\n            KONG_PG_USER: kong\n            KONG_PG_PASSWORD: xio9alaitavooR5f\n            KONG_PG_PORT: 5432\n        depends_on:\n            - microapi-database\n\n    #######################################\n    # Kong: The API Gateway\n    #######################################\n    kong:\n        image: kong:1.4.3-alpine\n        restart: unless-stopped\n        environment:\n            KONG_DATABASE: postgres\n            KONG_PG_HOST: microapi-database\n            KONG_PG_DATABASE: kong\n            KONG_PG_USER: kong\n            KONG_PG_PORT: 5432\n            KONG_PG_PASSWORD: xio9alaitavooR5f\n            KONG_PROXY_LISTEN: 0.0.0.0:8000\n            KONG_PROXY_LISTEN_SSL: 0.0.0.0:8443\n            KONG_ADMIN_LISTEN: 0.0.0.0:8001\n            VIRTUAL_HOST: lin.ks\n            VIRTUAL_PORT: 8000\n        depends_on:\n            - kong-migration\n            - microapi-database\n            - microapi\n        healthcheck:\n            test: [\"CMD\", \"kong\", \"health\"]\n            interval: 5s\n            timeout: 2s\n            retries: 15\n        ports:\n            - \"8001:8001\"\n            - \"8000:8000\"\n\n    #######################################\n    # Konga: Database prepare\n    #######################################\n    konga-prepare:\n        image: pantsel\u002Fkonga:next\n        command: \"-c prepare -a postgres -u postgresql:\u002F\u002Fkong:xio9alaitavooR5f@microapi-database:5432\u002Fkong\"\n        restart: on-failure\n        depends_on:\n            - kong\n            - microapi-database\n\n    #######################################\n    # Konga: GUI\n    #######################################\n    konga:\n        image: pantsel\u002Fkonga:next\n        restart: unless-stopped\n        environment:\n            DB_ADAPTER: postgres\n            DB_HOST: microapi-database\n            DB_DATABASE: kong\n            DB_USER: kong\n            DB_PASSWORD: xio9alaitavooR5f\n            TOKEN_SECRET: km1GUr4RkcQD7DewhJPNXrCuZwcKmqjb\n            NODE_ENV: production\n        depends_on:\n            - konga-prepare\n            - microapi-database\n        ports:\n            - \"1337:1337\"\n\n    #######################################\n    # Postgres: Common database\n    #######################################\n    microapi-database:\n        container_name: postgres\n        #        image: postgres:12.1\n        image: postgres:9.6 # konga requires 9.6\n        restart: unless-stopped\n        environment:\n            POSTGRES_USER: microapi\n            POSTGRES_PASSWORD: xio9alaitavooR5f\n            POSTGRES_MULTIPLE_DATABASES: kong,kong\n        volumes:\n            - .\u002Fdocker\u002Fpostgres\u002Finit:\u002Fdocker-entrypoint-initdb.d\n        ports:\n            - \"5432:5432\"\n        healthcheck:\n            test: [\"CMD\", \"pg_isready\", \"-U\", \"microapi\"]\n            interval: 5s\n            timeout: 5s\n            retries: 5\n\nvolumes:\n    vhost:\n"}]}]}]},{type:a,value:n},{type:b,tag:w,props:{},children:[{type:a,value:"So to briefly explain, "},{type:b,tag:f,props:{},children:[{type:a,value:K}]},{type:a,value:" is used as a discovery service for any "},{type:b,tag:f,props:{},children:[{type:a,value:r}]},{type:a,value:" related stuff. In the past, "},{type:b,tag:f,props:{},children:[{type:a,value:r}]},{type:a,value:" used "},{type:b,tag:f,props:{},children:[{type:a,value:"Consul"}]},{type:a,value:", and locally "},{type:b,tag:f,props:{},children:[{type:a,value:"MDNS"}]},{type:a,value:".  If you decide to add any Golang services\u002FAPIs written with the "},{type:b,tag:f,props:{},children:[{type:a,value:r}]},{type:a,value:" framework, you will need to add "},{type:b,tag:f,props:{},children:[{type:a,value:"--registry=etcd --registry_address=etcd:2379"}]},{type:a,value:" to the command segment. This makes your app discoverable by "},{type:b,tag:f,props:{},children:[{type:a,value:K}]},{type:a,value:".  To utilize the "},{type:b,tag:f,props:{},children:[{type:a,value:"micro api"}]},{type:a,value:" it is simple. Pull the "},{type:b,tag:f,props:{},children:[{type:a,value:r}]},{type:a,value:" image and append "},{type:b,tag:f,props:{},children:[{type:a,value:"api --handler=http"}]},{type:a,value:".  We technically could use the "},{type:b,tag:f,props:{},children:[{type:a,value:"nginx-proxy"}]},{type:a,value:" to the "},{type:b,tag:f,props:{},children:[{type:a,value:"microapi"}]},{type:a,value:"; however, from what I read, thus far, "},{type:b,tag:f,props:{},children:[{type:a,value:r}]},{type:a,value:" does not have any security incorporated into this API gateway. Therefore, "},{type:b,tag:f,props:{},children:[{type:a,value:x}]},{type:a,value:" was an obvious choice. To get "},{type:b,tag:f,props:{},children:[{type:a,value:x}]},{type:a,value:" up and running we need to have "},{type:b,tag:f,props:{},children:[{type:a,value:y}]},{type:a,value:" or "},{type:b,tag:f,props:{},children:[{type:a,value:"cassandra"}]},{type:a,value:" running. I opted for "},{type:b,tag:f,props:{},children:[{type:a,value:y}]},{type:a,value:". In addition, we need to make a migration. I have also included prepartion for "},{type:b,tag:f,props:{},children:[{type:a,value:"Konga"}]},{type:a,value:", an admin GUI interface for "},{type:b,tag:f,props:{},children:[{type:a,value:x}]},{type:a,value:". This as well requires a preparation container."}]},{type:a,value:n},{type:b,tag:w,props:{},children:[{type:a,value:"On a side note, you may have noticed that I am using a volume for "},{type:b,tag:f,props:{},children:[{type:a,value:y}]},{type:a,value:". This is because I needed several databases. To accomplished this, I am loading a script into "},{type:b,tag:f,props:{},children:[{type:a,value:"\u002Fdocker-entrypoint-initdb.d"}]}]},{type:a,value:n},{type:b,tag:G,props:{className:[H]},children:[{type:b,tag:I,props:{className:[J,"language-bash"]},children:[{type:b,tag:f,props:{},children:[{type:b,tag:c,props:{className:[d,"shebang","important"]},children:[{type:a,value:"#!\u002Fbin\u002Fbash"}]},{type:a,value:L},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:M}]},{type:a,value:" -e\n"},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:M}]},{type:a,value:" -u\n\n"},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:o}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,"function-name",o]},children:[{type:a,value:"create_user_and_database"}]},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:"("}]},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:u}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:"{"}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:N}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,z,g]},children:[{type:a,value:"database"}]},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:A}]},{type:b,tag:c,props:{className:[d,g]},children:[{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:B}]},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:q}]},{type:a,value:O},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:s}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,o]},children:[{type:a,value:C}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:P}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:D}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:s}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,o]},children:[{type:a,value:Q}]},{type:a,value:R},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:S},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:"$1"}]},{type:a,value:T}]},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:u}]}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:N}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,z,g]},children:[{type:a,value:"owner"}]},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:A}]},{type:b,tag:c,props:{className:[d,g]},children:[{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:B}]},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:q}]},{type:a,value:O},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:s}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,o]},children:[{type:a,value:C}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:P}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:D}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:s}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,o]},children:[{type:a,value:Q}]},{type:a,value:R},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:S},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:"$2"}]},{type:a,value:T}]},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:u}]}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:q}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:"\"  Creating user and database '"},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:E}]},{type:a,value:"'\""}]},{type:a,value:"\n    psql -v "},{type:b,tag:c,props:{className:[d,z,g]},children:[{type:a,value:"ON_ERROR_STOP"}]},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:A}]},{type:b,tag:c,props:{className:[d,"number"]},children:[{type:a,value:"1"}]},{type:a,value:" --username "},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:t},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:"$POSTGRES_USER"}]},{type:a,value:t}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:"\u003C\u003C-"}]},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:"EOSQL\n        CREATE ROLE "},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:U}]},{type:a,value:" LOGIN PASSWORD '"},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:"$POSTGRES_PASSWORD"}]},{type:a,value:"';\n        CREATE DATABASE "},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:E}]},{type:a,value:";\n        GRANT ALL PRIVILEGES ON DATABASE "},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:E}]},{type:a,value:" TO "},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:U}]},{type:a,value:";\nEOSQL"}]},{type:a,value:n},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:"}"}]},{type:a,value:L},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"if"}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:"["}]},{type:a,value:" -n "},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:t},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:V}]},{type:a,value:t}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:"]"}]},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:W}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"then"}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:q}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:"\"Multiple database creation requested: "},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:V}]},{type:a,value:t}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"for"}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,"for-or-select",g]},children:[{type:a,value:"db"}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"in"}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,g]},children:[{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:B}]},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:q}]},{type:a,value:" $POSTGRES_MULTIPLE_DATABASES "},{type:b,tag:c,props:{className:[d,k]},children:[{type:a,value:s}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,o]},children:[{type:a,value:C}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:"':'"}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:D}]},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:u}]}]},{type:b,tag:c,props:{className:[d,m]},children:[{type:a,value:W}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"do"}]},{type:a,value:"\n        create_user_and_database "},{type:b,tag:c,props:{className:[d,g]},children:[{type:a,value:"$db"}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"done"}]},{type:a,value:p},{type:b,tag:c,props:{className:[d,i,j]},children:[{type:a,value:q}]},{type:a,value:e},{type:b,tag:c,props:{className:[d,h]},children:[{type:a,value:"\"Multiple databases created\""}]},{type:a,value:n},{type:b,tag:c,props:{className:[d,l]},children:[{type:a,value:"fi"}]},{type:a,value:n}]}]}]}]},dir:"\u002Farticles",path:"\u002Farticles\u002Fkong-micro",extension:".md",slug:"kong-micro",createdAt:"2020-07-22T00:27:09.698Z",updatedAt:"2020-07-25T22:21:25.071Z"},prev:{title:"Pushing Dockerfiles",updateAt:v,slug:"dockerhub"},next:{title:"Logging Symfony applications to a ELK stack",updateAt:v,slug:"symfony-elk"}}],fetch:[],mutations:[]}}("text","element","span","token"," ","code","variable","string","builtin","class-name","operator","keyword","punctuation","\n","function","\n    ","echo","micro","|","\"",")","2020-07-19T03:00:00.000Z","p","Kong","postgres","assign-left","=","$(","tr","' '","$database","Micro Kong","div","nuxt-content-highlight","pre","line-numbers","Etcd","\n\n","set","local"," $1 ","','","awk","  ","'{print ","}'","$owner","$POSTGRES_MULTIPLE_DATABASES",";")));