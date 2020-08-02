<template>
  <div class="container">
    <section class="section">
      <div class="container pb-6">
        <AppSearchInput />
      </div>
      <div class="container">
        <h2 class="title has-text-centered mb-6">
          Featured Articles
        </h2>
        <template v-for="i in Math.ceil(articlesFeatured.length / 3)">
          <div :key="`${i}-${rndStr(5)}`" class="columns is-multiline">
            <template
              v-for="(item, item_index) in articlesFeatured.slice(
                (i - 1) * 3,
                i * 3,
              )"
            >
              <div
                :key="`${item_index}-${rndStr(5)}`"
                class="column is-12 is-4-desktop"
              >
                <div class="card equal-height" style="height: 100%;">
                  <div class="card-image">
                    <nuxt-link :to="'/blog/articles/' + item.slug">
                      <figure class="image is-4by3">
                        <img
                          :srcset="
                            require(`~/assets/images/${item.img}`).srcSet
                          "
                          :alt="item.alt"
                        />
                      </figure>
                    </nuxt-link>
                  </div>
                  <div class="card-content">
                    <span class="is-size-7">
                      {{ item.publishedAt | formatDate('MMM DD, YYYY') }}
                    </span>
                    <h5 class="title is-5">
                      <nuxt-link :to="'/blog/articles/' + item.slug">
                        {{ item.title }}
                      </nuxt-link>
                    </h5>
                    <p class="has-text-dark pb-7">
                      {{ item.description }}
                    </p>
                  </div>
                  <footer class="card-footer">
                    <a
                      class="card-footer-item is-primary"
                      :href="'/blog/articles/' + item.slug"
                      >Read more</a
                    >
                  </footer>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </section>
    <section class="section">
      <div class="container py-4">
        <h2 class="title has-text-centered mb-6">
          Past Articles
        </h2>
        <div class="panel">
          <div
            v-for="item in articlesGeneral"
            :key="`${item.id}-${rndStr(5)}`"
            class="panel-block is-block py-3 px-4"
          >
            <a class="media" :href="'/blog/articles/' + item.slug">
              <div class="media-content">{{ item.title }}</div>
              <div class="media-right">
                <font-awesome-layers class="fa-1x">
                  <font-awesome-icon :icon="['fas', 'chevron-down']" />
                </font-awesome-layers>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import '~/helpers/date-format'
import AppSearchInput from '~/components/AppSearchInput.vue'

export default Vue.extend({
  components: {
    AppSearchInput,
  },
  async asyncData({ $content, params }) {
    const articlesFeatured = await $content('articles', params.slug)
      .only([
        'title',
        'description',
        'img',
        'alt',
        'slug',
        'author',
        'publishedAt',
        'updateAt',
      ])
      .where({ featured: { $eq: 1 } })
      .sortBy('publishedAt', 'desc')
      .fetch()
    const articlesGeneral = await $content('articles', params.slug)
      .only([
        'title',
        'description',
        'img',
        'alt',
        'slug',
        'author',
        'publishedAt',
        'updateAt',
      ])
      .where({ featured: { $eq: 0 } })
      .sortBy('publishedAt', 'desc')
      .fetch()
    return {
      articlesFeatured,
      articlesGeneral,
    }
  },
  methods: {
    rndStr(len: number): string {
      let text = ' '
      const chars = 'abcdefghijklmnopqrstuvwxyz'
      for (let i = 0; i < len; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return text
    },
  },
  head() {
    return {
      title: 'Blog Entries',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'An assortment of topics in the area of tech.',
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'jessequinn.info blog',
        },
        {
          hid: 'twitter:site',
          name: 'twitter:site',
          content: 'jessequinn.info',
        },
        {
          hid: 'twitter:creator',
          name: 'twitter:creator',
          content: 'jesse quinn',
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'jessequinn.info blog',
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'An assortment of topics in the area of tech.',
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content:
            'https://jessequinn.info' +
            require('~/assets/images/john-jennings-fg7J6NnebBc-unsplash.jpg'),
        },
        {
          hid: 'description',
          name: 'description',
          content: 'An assortment of topics in the area of tech.',
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: 'https://jessequinn.info/blog',
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content:
            'https://jessequinn.info' +
            require('~/assets/images/john-jennings-fg7J6NnebBc-unsplash.jpg'),
        },
        {
          hid: 'og:site_name',
          name: 'og:site_name',
          content: 'jessequinn.info',
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'jessequinn blog',
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'An assortment of topics in the area of tech.',
        },
      ],
    }
  },
})
</script>
