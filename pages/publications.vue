<template>
  <section class="section">
    <div class="container">
      <div class="row">
        <h1 class="title">
          {{ $t('publications.publications') }}
        </h1>
        <h2 class="subtitle">
          {{ $t('publications.subline') }}
        </h2>
      </div>
    </div>
    <div class="container mt-6">
      <div class="tile is-ancestor">
        <div class="tile is-12 is-vertical">
          <article
            v-for="(publication, index) in payload.publications"
            :key="index"
            class="tile is-child notification"
          >
            <p class="title">
              <a
                class="is-text-decoration-less"
                :href="publication.website"
                target="_blank"
              >
                {{ publication.title }}
              </a>
            </p>
            <p class="subtitle is-marginless">
              <small>
                Published online:
                {{ publication.releasedAt | formatDate('MMM DD. YYYY') }}
              </small>
              <a :href="publication.pdf" target="_blank">
                <span class="icon has-text-danger">
                  <font-awesome-layers class="fa-1x">
                    <font-awesome-icon :icon="['far', 'file-pdf']" />
                  </font-awesome-layers>
                </span>
              </a>
            </p>
            <p class="subtitle">
              <small>
                {{ publication.journal.title }} {{ publication.journal.year }},
                {{ publication.journal.volume }} ({{
                  publication.journal.issue
                }}), {{ publication.journal.pages }}
              </small>
            </p>
            <div class="content">
              <p class="has-text-justified">
                {{ publication.summary }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import '@/helpers/date-format'

@Component({
  components: {},
})
export default class Publications extends Vue {
  async asyncData(ctx: any) {
    const payload = await ctx
      .$content('publications')
      .fetch()
      .catch(() => {
        ctx.error({ statusCode: 404, message: 'Page not found' })
      })

    return {
      payload,
    }
  }

  head() {
    return {
      title: 'Publications',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'A detailed list of publications from jesse quinn.',
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'Publications from jesse quinn',
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
          content: 'Publications from jesse quinn',
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'A detailed list of publications from jesse quinn.',
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content:
            'https://jessequinn.info' +
            require('assets/images/john-jennings-fg7J6NnebBc-unsplash.jpg'),
        },
        {
          hid: 'description',
          name: 'description',
          content: 'A detailed list of publications from jesse quinn.',
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: 'https://jessequinn.info/publications',
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content:
            'https://jessequinn.info' +
            require('assets/images/john-jennings-fg7J6NnebBc-unsplash.jpg'),
        },
        {
          hid: 'og:site_name',
          name: 'og:site_name',
          content: 'jessequinn.info',
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Publications from jesse quinn',
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'A detailed list of publications from jesse quinn.',
        },
      ],
    }
  }
}
</script>
