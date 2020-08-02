__NUXT_JSONP__("/blog/articles/tensorflow", (function(a,b,c,d,e,f,g,h,i,j,k,l){return {data:[{article:{title:g,description:"A brief run through for compiling a pip wheel for an optimized gpu Tensorflow",img:"joao-tzanno-G9_Euqxpu4k-unsplash.jpg",alt:g,featured:0,author:{name:"Jesse Quinn",bio:"All about Jesse",img:"https:\u002F\u002Fimages.unsplash.com\u002Fphoto-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80",alt:"profile photo"},publishedAt:"2019-10-28T03:00:00.000Z",updateAt:e,toc:[],body:{type:"root",children:[{type:b,tag:d,props:{},children:[{type:a,value:"Although majority of the information can be found at "},{type:b,tag:h,props:{href:"https:\u002F\u002Fwww.tensorflow.org\u002Finstall\u002Fsource",rel:[i,j,k],target:l},children:[{type:a,value:"Tensorflow"}]},{type:a,value:", I will provide a short Bash script that does all the thinking for you. Because I use pyenv virtualenv and the lastest cuda\u002Fcudnn on Manjaro, I ran into an issue with the prebuilt pip tensorflow-gpu. Of couse it complained about the cuda version not being 10.0 while I have 10.1 installed. To get around this, atleast from what I know, you will need to recompile Tensorflow... be prepared.. it takes a long time even for an i7 with 65gb ramm!!! Of course, you can downgrade, but I do not like doing that. Before you begin, you will need to do a "}]},{type:a,value:c},{type:b,tag:"div",props:{className:["nuxt-content-highlight"]},children:[{type:b,tag:"pre",props:{className:["language-text","line-numbers"]},children:[{type:b,tag:"code",props:{},children:[{type:a,value:"pip install wheel \n"}]}]}]},{type:a,value:c},{type:b,tag:d,props:{},children:[{type:a,value:"Using portions of Archlinux "},{type:b,tag:h,props:{href:"https:\u002F\u002Fwww.archlinux.org\u002Fpackages\u002Fcommunity\u002Fx86_64\u002Fpython-tensorflow-opt-cuda\u002F",rel:[i,j,k],target:l},children:[{type:a,value:"PKGBUILD"}]},{type:a,value:" for tensorflow, I decided to make a Bash script that would do all the thinking for me, as I simply wanted to create a pip wheel for my virtualenv!"}]},{type:a,value:c},{type:b,tag:f,props:{src:"https:\u002F\u002Fgist.github.com\u002Fjessequinn\u002F724859b576aea1efbfa20bd28d006cb2.js"},children:[]},{type:a,value:c},{type:b,tag:d,props:{},children:[{type:a,value:"Modify as you desire and remember this will take sometime."}]},{type:a,value:c},{type:b,tag:d,props:{},children:[{type:a,value:"In addition, you will need a patch,"}]},{type:a,value:c},{type:b,tag:f,props:{src:"https:\u002F\u002Fgist.github.com\u002Fjessequinn\u002Fd622364a22805d8f892756d47ff6519d.js"},children:[]},{type:a,value:c},{type:b,tag:f,props:{src:"https:\u002F\u002Fgist.github.com\u002Fjessequinn\u002F34ea874fe8ec4e7bef8de8fa6ba6aba8.js"},children:[]},{type:a,value:c},{type:b,tag:d,props:{},children:[{type:a,value:"Best of luck"}]}]},dir:"\u002Farticles",path:"\u002Farticles\u002Ftensorflow",extension:".md",slug:"tensorflow",createdAt:"2020-07-22T00:27:09.714Z",updatedAt:"2020-07-22T00:30:14.112Z"},prev:{title:"PyQt5 Programming",updateAt:e,slug:"pyqt5"},next:{title:"Top 5% of Highly Cited Authors",updateAt:e,slug:"citation"}}],fetch:[],mutations:[]}}("text","element","\n","p","2020-07-19T03:00:00.000Z","script","Compiling Tensorflow","a","nofollow","noopener","noreferrer","_blank")));