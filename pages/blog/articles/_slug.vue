<template>
  <section class="hero">
    <div class="hero-body">
      <section class="section">
        <div class="container">
          <div class="columns">
            <div class="column is-8 is-offset-2">
              <div class="content">
                <figure class="is-hidden-touch is-marginless">
                  <img
                    :srcset="require(`~/assets/images/${article.img}`).srcSet"
                    :alt="article.alt"
                  />
                </figure>
                <h1 class="title pt-5">
                  {{ article.title }}
                </h1>
                <h2 class="subtitle is-6">
                  <p>
                    Article last updated:
                    {{ article.updateAt | formatDate('MMM DD, YYYY') }}
                  </p>
                </h2>

                <nav>
                  <p>Table of contents:</p>
                  <ol type="I" class="pb-5">
                    <li v-for="link of article.toc" :key="link.id">
                      <NuxtLink
                        :to="`#${link.id}`"
                        :class="{
                          'py-6': link.depth === 2,
                          'ml-3 pb-6': link.depth === 3,
                        }"
                      >
                        {{ link.text }}
                      </NuxtLink>
                    </li>
                  </ol>
                </nav>

                <div class="has-text-justified">
                  <nuxt-content :document="article" />
                </div>

                <div class="has-text-justified">
                  <script
                    type="application/javascript"
                    src="https://utteranc.es/client.js"
                    repo="jessequinn/static_site_jessequinn"
                    issue-term="pathname"
                    label="Comment"
                    theme="github-light"
                    crossorigin="anonymous"
                    async
                  ></script>
                </div>

                <PrevNext :prev="prev" :next="next" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script lang="js">
import PrevNext from '~/components/PrevNext.vue'
import '~/helpers/date-format'

export default {
  components: { PrevNext },
  async asyncData ({ $content, params, error }) {
    const article = await $content('articles', params.slug).fetch()
    const [prev, next] = await $content('articles')
      .only(['title', 'slug', 'updateAt'])
      .sortBy('publishedAt', 'asc')
      .surround(params.slug)
      .fetch()
      .catch(() => {
        error({ statusCode: 404, message: 'Page not found' })
      })
    return {
      article,
      prev,
      next
    }
  },
  head () {
    return {
      title: this.article.title,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.article.description
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: this.article.description
        },
        {
          hid: 'twitter:site',
          name: 'twitter:site',
          content: 'jessequinn.info'
        },
        {
          hid: 'twitter:creator',
          name: 'twitter:creator',
          content: 'jesse quinn'
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: this.article.title
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: this.article.description
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content: 'https://jessequinn.info' + require(`~/assets/images/${this.article.img}`)
        },
        {
          hid: 'description',
          name: 'description',
          content: this.article.description
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: 'https://jessequinn.info/blog/articles/' + this.article.slug
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: 'https://jessequinn.info' + require(`~/assets/images/${this.article.img}`)
        },
        {
          hid: 'og:site_name',
          name: 'og:site_name',
          content: 'jessequinn.info'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.article.title
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: this.article.description
        }
      ]
    }
  }
}
</script>

<style>
.icon.icon-link {
  background-image: url('~assets/svg/icon-hashtag.svg');
  display: inline-block;
  width: 20px;
  height: 20px;
  background-size: 20px 20px;
}
</style>
