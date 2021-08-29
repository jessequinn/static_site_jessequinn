import webpack from 'webpack'

export default {
  mode: 'spa',
  // target: 'static',
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },
  head: {
    title: 'Welcome to jessequinn.info',
    meta: [
      { charset: 'utf-8' },
      {
        hid: 'viewport',
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      },
      {
        hid: 'twitter:card',
        name: 'twitter:card',
        content: 'A site dedicated to jesse quinn.',
      },
      { hid: 'twitter:site', name: 'twitter:site', content: 'jessequinn.info' },
      {
        hid: 'twitter:creator',
        name: 'twitter:creator',
        content: 'jesse quinn',
      },
      {
        hid: 'twitter:title',
        name: 'twitter:title',
        content:
          'A site dedicated to jesse quinn. It contains a resume, publications, and blog.',
      },
      {
        hid: 'twitter:description',
        name: 'twitter:description',
        content:
          'A site dedicated to jesse quinn. It contains a resume, publications, and blog.',
      },
      {
        hid: 'twitter:image',
        name: 'twitter:image',
        content:
          'https://jessequinn.info/images/john-jennings-fg7J6NnebBc-unsplash.jpg',
      },
      {
        hid: 'description',
        name: 'description',
        content:
          'A site dedicated to jesse quinn. It contains a resume, publications, and blog.',
      },
      {
        hid: 'og:url',
        property: 'og:url',
        content: 'https://jessequinn.info',
      },
      {
        hid: 'og:image',
        property: 'og:image',
        content:
          'https://jessequinn.info/images/john-jennings-fg7J6NnebBc-unsplash.jpg',
      },
      {
        hid: 'og:site_name',
        name: 'og:site_name',
        content: 'jessequinn.info',
      },
      {
        hid: 'og:title',
        name: 'og:title',
        content:
          'A site dedicated to jesse quinn. It contains a resume, publications, and blog.',
      },
      {
        hid: 'og:description',
        name: 'og:description',
        content:
          'A site dedicated to jesse quinn. It contains a resume, publications, and blog.',
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    script: [
      {
        src: '/js/main.js', // TODO: find an alternative way with webpack
      },
    ],
  },
  loading: { color: '#ffffff' },
  router: {
    middleware: 'i18n',
  },
  generate: {
    routes: ['/'],
    subFolders: true,
  },
  css: ['@assets/scss/main.scss'],
  plugins: [
    '~/plugins/i18n.js',
    { src: '~/plugins/vue-chart.js', mode: 'client' },
  ],
  components: true,
  buildModules: [
    '@nuxt/typescript-build',
    'nuxt-fontawesome',
    [
      '@nuxtjs/google-analytics',
      {
        id: 'UA-126093158-1',
      },
    ],
  ],
  fontawesome: {
    imports: [
      {
        set: '@fortawesome/free-solid-svg-icons',
        icons: [
          'faSmileWink',
          'faGlobe',
          'faBrain',
          'faDrumstickBite',
          'faPaperclip',
          'faAt',
          'faGraduationCap',
          'faCertificate',
          'faChevronDown',
          'faChevronRight',
          'faChevronLeft',
          'faRss',
        ],
      },
      {
        set: '@fortawesome/free-regular-svg-icons',
        icons: ['faFilePdf', 'faBuilding'],
      },
      {
        set: '@fortawesome/free-brands-svg-icons',
        icons: [
          'faDev',
          'faFacebook',
          'faTwitter',
          'faOrcid',
          'faResearchgate',
          'faGithub',
          'faLinkedinIn',
          'faReadme',
        ],
      },
    ],
  },
  modules: [
    '@nuxt/content',
    '@nuxtjs/sitemap',
    'nuxt-responsive-loader',
    // '@nuxtjs/feed',
  ],
  responsiveLoader: {
    name: 'img/[hash:7]-[width].[ext]',
    min: 640, // minimum image width generated
    max: 1080, // maximum image width generated
    steps: 5, // five sizes per image will be generated
    placeholder: false, // no placeholder will be generated
    quality: 65, // images are compressed with medium quality
    adapter: require('responsive-loader/sharp'),
  },
  // feed() {
  //   const baseUrlArticles = 'https://jessequinn.info/blog/articles'
  //   const baseLinkFeedArticles = '/feed/articles'
  //   const feedFormats = {
  //     // rss: { type: 'rss2', file: 'rss.xml' },
  //     // atom: { type: 'atom1', file: 'atom.xml' },
  //     json: { type: 'json1', file: 'feed.json' },
  //   }
  //   const { $content } = require('@nuxt/content')
  //
  //   const createFeedArticles = async function (feed) {
  //     feed.options = {
  //       title: "Jesse Quinn's Blog",
  //       description: 'I write about technology',
  //       link: baseUrlArticles,
  //     }
  //     const articles = await $content('articles')
  //       .only(['title', 'description', 'slug', 'author', 'publishedAt'])
  //       .sortBy('publishedAt', 'desc')
  //       .fetch()
  //
  //     articles.forEach((article) => {
  //       const url = `${baseUrlArticles}/${article.slug}`
  //
  //       feed.addItem({
  //         title: article.title,
  //         id: url,
  //         link: url,
  //         date: new Date(article.publishedAt),
  //         description: article.description,
  //         content: article.description,
  //         author: article.author,
  //       })
  //     })
  //   }
  //
  //   return Object.values(feedFormats).map(({ file, type }) => ({
  //     path: `${baseLinkFeedArticles}/${file}`,
  //     type,
  //     create: createFeedArticles,
  //   }))
  // },
  content: {
    markdown: {
      prism: {
        theme: 'prism-themes/themes/prism-vs.css',
      },
    },
  },
  sitemap: {
    path: '/sitemap.xml',
    hostname: 'https://jessequinn.info',
    cacheTime: 1000 * 60 * 15,
    gzip: true,
    generate: false,
    routes: [
      '/',
      '/resume',
      '/publications',
      '/blog',
      '/blog/articles/acs-override',
      '/blog/articles/citation',
      '/blog/articles/dockerhub',
      '/blog/articles/drone',
      '/blog/articles/drone-again',
      '/blog/articles/elastic-stack',
      '/blog/articles/elastic-volumes',
      '/blog/articles/golang-graphql',
      '/blog/articles/google-photo-api',
      '/blog/articles/gpu-passthrough',
      '/blog/articles/grafana',
      '/blog/articles/graylog',
      '/blog/articles/imgur',
      '/blog/articles/kong-ingress',
      '/blog/articles/kong-micro',
      '/blog/articles/lamp',
      '/blog/articles/linters',
      '/blog/articles/mlp-numpy',
      '/blog/articles/mongo-docker',
      '/blog/articles/nrc-publication',
      '/blog/articles/php-cms-1',
      '/blog/articles/php-cms-2',
      '/blog/articles/prometheus',
      '/blog/articles/pyqt5',
      '/blog/articles/symfony-elk',
      '/blog/articles/tensorflow',
      '/blog/articles/webpack-highlight',
      '/blog/articles/k8s-bare-metal',
      '/blog/articles/hashicorp-packer',
    ].map((route) => ({
      url: route,
      changefreq: 'monthly',
      priority: 1,
      lastmodISO: new Date().toISOString().split('T')[0],
    })),
  },
  build: {
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
      }),
    ],
    postcss: {
      preset: {
        features: {
          customProperties: false,
        },
      },
    },
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/,
        })
      }
    },
  },
  typescript: {
    typeCheck: {
      eslint: {
        files: './**/*.{ts,js,vue}',
      },
    },
  },
}
