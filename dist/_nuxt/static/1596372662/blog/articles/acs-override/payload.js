__NUXT_JSONP__("/blog/articles/acs-override", (function(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D){return {data:[{article:{title:w,description:"A quick walk-through for the installation of an ACS override patch.",img:"joao-tzanno-G9_Euqxpu4k-unsplash.jpg",alt:w,featured:1,author:{name:"Jesse Quinn",bio:"All about Jesse",img:"https:\u002F\u002Fimages.unsplash.com\u002Fphoto-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80",alt:"profile photo"},publishedAt:"2019-03-04T03:00:00.000Z",updateAt:x,toc:[],body:{type:"root",children:[{type:b,tag:p,props:{id:"github-repos"},children:[{type:b,tag:f,props:{href:"#github-repos",ariaHidden:q,tabIndex:r},children:[{type:b,tag:s,props:{className:[t,u]},children:[]}]},{type:a,value:"Github Repos"}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"You can clone my repos and run the following:"}]},{type:a,value:c},{type:b,tag:k,props:{className:[l]},children:[{type:b,tag:m,props:{className:[n,o]},children:[{type:b,tag:d,props:{},children:[{type:a,value:"makepkg -sri\n"}]}]}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:b,tag:f,props:{href:"https:\u002F\u002Fgithub.com\u002Fjessequinn\u002Fmanjaro_custom_kernel_linux419_ACS_override",rel:[g,h,i],target:j},children:[{type:a,value:"Linux419"}]},{type:a,value:" updated to linux419-4.19.30-1"}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:b,tag:f,props:{href:y,rel:[g,h,i],target:j},children:[{type:a,value:"Linux420"}]},{type:a,value:" updated to linux420-4.20.17.-1"}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:b,tag:f,props:{href:"https:\u002F\u002Fgithub.com\u002Fjessequinn\u002Fmanjaro_custom_kernel_linux50_ACS_override",rel:[g,h,i],target:j},children:[{type:a,value:"Linux50"}]},{type:a,value:"  updated to linux50-5.0.3-1"}]},{type:a,value:c},{type:b,tag:p,props:{id:"intro"},children:[{type:b,tag:f,props:{href:"#intro",ariaHidden:q,tabIndex:r},children:[{type:b,tag:s,props:{className:[t,u]},children:[]}]},{type:a,value:"Intro"}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"This walk-through will quickly cover an important topic of adding a "},{type:b,tag:z,props:{},children:[{type:a,value:"patch"}]},{type:a,value:" to a kernel, but more specifically, the ACS override patch. This patch allows those who want to pass-through a specific device such as a GPU to a virtual machine such that the virtual machine has a dedicated device. More over, this patch is required if, for instance, your current IOMMU groups are not well separated. The idea may be better explained over at "},{type:b,tag:f,props:{href:"https:\u002F\u002Fwiki.archlinux.org\u002Findex.php\u002FPCI_passthrough_via_OVMF#Bypassing_the_IOMMU_groups_(ACS_override_patch)",rel:[g,h,i],target:j},children:[{type:a,value:"Archlinux"}]},{type:a,value:". Before starting you can easily download my "},{type:b,tag:f,props:{href:y,rel:[g,h,i],target:j},children:[{type:a,value:A}]},{type:a,value:" that includes the patch and is setup for "},{type:b,tag:d,props:{},children:[{type:a,value:"kernel 4.20.11"}]},{type:a,value:v}]},{type:a,value:c},{type:b,tag:p,props:{id:"howto"},children:[{type:b,tag:f,props:{href:"#howto",ariaHidden:q,tabIndex:r},children:[{type:b,tag:s,props:{className:[t,u]},children:[]}]},{type:a,value:"Howto"}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"To begin, we will need a copy of the manjaro kernel. This will be specific to your taste, as currently, there are two kernels i work with that may or may not represent your current kernel. Two branches i have made custom kernels for are long-term (4.19) and stable (4.20). To get a better idea of the current state of kernels visit the "},{type:b,tag:f,props:{href:"https:\u002F\u002Fwww.kernel.org\u002F",rel:[g,h,i],target:j},children:[{type:a,value:"kernel site"}]},{type:a,value:". To get the current manjaro kernel for your build go to the core package "},{type:b,tag:f,props:{href:"https:\u002F\u002Fgitlab.manjaro.org\u002Fpackages\u002Fcore",rel:[g,h,i],target:j},children:[{type:a,value:A}]},{type:a,value:" and copy the address of the kernel you want to work with. I selected 4.20. I assume you are doing this on a linux machine and such open your terminal and git clone that repository."}]},{type:a,value:c},{type:b,tag:k,props:{className:[l]},children:[{type:b,tag:m,props:{className:[n,o]},children:[{type:b,tag:d,props:{},children:[{type:a,value:"git clone https:\u002F\u002Fgitlab.manjaro.org\u002Fpackages\u002Fcore\u002Flinux420.git\ncd linux420\n"}]}]}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"Once inside the kernel directory use your favourite code editor, for instance nano, and modify two areas. 1) the source function "},{type:b,tag:d,props:{},children:[{type:a,value:"source = ( .... )"}]},{type:a,value:" and 2) the prepare function "},{type:b,tag:d,props:{},children:[{type:a,value:"prepare=( ... )"}]},{type:a,value:v}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"First we need to add the source of the patch to the source function. Within the 4.20 kernel PKGBUILD at the end of the source function we should see something like:"}]},{type:a,value:c},{type:b,tag:k,props:{className:[l]},children:[{type:b,tag:m,props:{className:[n,o]},children:[{type:b,tag:d,props:{},children:[{type:a,value:"'0001-bootsplash.patch'\n'0002-bootsplash.patch'\n'0003-bootsplash.patch'\n'0004-bootsplash.patch'\n'0005-bootsplash.patch'\n'0006-bootsplash.patch'\n'0007-bootsplash.patch'\n'0008-bootsplash.patch'\n'0009-bootsplash.patch'\n'0010-bootsplash.patch'\n'0011-bootsplash.patch'\n'0012-bootsplash.patch'\n'0013-bootsplash.patch')\n"}]}]}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"Now add the acso patch, which can be found on the site "},{type:b,tag:f,props:{href:"https:\u002F\u002Fqueuecumber.gitlab.io\u002Flinux-acs-override\u002F",rel:[g,h,i],target:j},children:[{type:a,value:"here"}]},{type:a,value:", on a new line beneath the 0013-bootsplash.patch and do not forget to move the terminating closed bracket to the following line as such:"}]},{type:a,value:c},{type:b,tag:k,props:{className:[l]},children:[{type:b,tag:m,props:{className:[n,o]},children:[{type:b,tag:d,props:{},children:[{type:a,value:"acso.patch::https:\u002F\u002Fgitlab.com\u002FQueuecumber\u002Flinux-acs-override\u002Fraw\u002Fmaster\u002Fworkspaces\u002F4.20\u002Facso.patch)\n"}]}]}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"Now it is time to modify the prepare function. I generally add the ACSO patch between two other patches:"}]},{type:a,value:c},{type:b,tag:k,props:{className:[l]},children:[{type:b,tag:m,props:{className:[n,o]},children:[{type:b,tag:d,props:{},children:[{type:a,value:"# add aufs4 support\npatch -Np1 -i \"${srcdir}\u002Faufs4.20.4+-${_aufs}.patch\"\npatch -Np1 -i \"${srcdir}\u002Faufs4-base.patch\"\npatch -Np1 -i \"${srcdir}\u002Faufs4-kbuild.patch\"\npatch -Np1 -i \"${srcdir}\u002Faufs4-loopback.patch\"\npatch -Np1 -i \"${srcdir}\u002Faufs4-mmap.patch\"\npatch -Np1 -i \"${srcdir}\u002Faufs4-standalone.patch\"\npatch -Np1 -i \"${srcdir}\u002Ftmpfs-idr.patch\"\npatch -Np1 -i \"${srcdir}\u002Fvfs-ino.patch\"\n\n# add ACS overide patch\npatch -Np1 -i \"${srcdir}\u002Facso.patch\" \n\n# add BFQ scheduler\npatch -Np1 -i \"${srcdir}\u002F0001-BFQ-${_bfq}-${_bfqdate}.patch\"\n"}]}]}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"Now we can save and close the PKGBUILD and run "},{type:b,tag:d,props:{},children:[{type:a,value:B}]},{type:a,value:". If you lack this command you will need to install "},{type:b,tag:d,props:{},children:[{type:a,value:"sudo pacman -S pacman-contrib"}]},{type:a,value:". This package also contains an important command "},{type:b,tag:d,props:{},children:[{type:a,value:"makepkg"}]},{type:a,value:v}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"Now that the checksums are updated by using the "},{type:b,tag:d,props:{},children:[{type:a,value:B}]},{type:a,value:" we can run "},{type:b,tag:d,props:{},children:[{type:a,value:C}]},{type:a,value:". This command will essentially compile, install, and update several key components for your new kernel to work. However, it must be noted, if you require packages from the "},{type:b,tag:f,props:{href:"https:\u002F\u002Fgitlab.manjaro.org\u002Fpackages\u002Fextra",rel:[g,h,i],target:j},children:[{type:a,value:"extra-modules"}]},{type:a,value:" such as Nvidia, please "},{type:b,tag:d,props:{},children:[{type:a,value:"git clone"}]},{type:a,value:" them and run "},{type:b,tag:d,props:{},children:[{type:a,value:C}]},{type:a,value:" or you will face boot errors. We can typically view all installed extra modules by running "},{type:b,tag:d,props:{},children:[{type:a,value:"pacman -Qs linux420"}]},{type:a,value:"(change linux420 to the kernel you are using)."}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"Now you should have a custom kernel with the ACS override patch applied. Do not forget to reboot and load the new kernel. "}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:b,tag:z,props:{},children:[{type:a,value:"import note"}]}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"This method will override your current kernel, for instance, linux420 kernel, if that is what you are using. "}]},{type:a,value:c},{type:b,tag:e,props:{},children:[{type:a,value:"The following bash script should allow you to view your IOMMU groups. "}]},{type:a,value:c},{type:b,tag:k,props:{className:[l]},children:[{type:b,tag:m,props:{className:[n,o]},children:[{type:b,tag:d,props:{},children:[{type:a,value:"#!\u002Fbin\u002Fbash\nshopt -s nullglob\nfor d in \u002Fsys\u002Fkernel\u002Fiommu_groups\u002F*\u002Fdevices\u002F*; do \n    n=${d#*\u002Fiommu_groups\u002F*}; n=${n%%\u002F*}\n    printf 'IOMMU Group %s ' \"$n\"\n    lspci -nns \"${d##*\u002F}\"\ndone;\n"}]}]}]}]},dir:"\u002Farticles",path:"\u002Farticles\u002Facs-override",extension:".md",slug:"acs-override",createdAt:D,updatedAt:D},prev:null,next:{title:"Google Photos API and Photo Storage",updateAt:x,slug:"google-photo-api"}}],fetch:[],mutations:[]}}("text","element","\n","code","p","a","nofollow","noopener","noreferrer","_blank","div","nuxt-content-highlight","pre","language-text","line-numbers","h4","true",-1,"span","icon","icon-link",".","ACS Override Patched Manjaro Kernel Walk-through","2020-07-19T03:00:00.000Z","https:\u002F\u002Fgithub.com\u002Fjessequinn\u002Fmanjaro_custom_kernel_linux420_ACS_override","strong","repository","updpkgsums","makepkg -sri","2020-07-22T00:27:09.694Z")));