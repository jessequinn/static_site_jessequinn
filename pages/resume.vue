<template>
  <section class="section">
    <div class="container">
      <div class="row columns">
        <div class="column">
          <aside class="menu">
            <p class="menu-label">
              {{ $t('resume.work.experience') }}
            </p>
            <ul class="menu-list">
              <li
                v-for="(work, index) in payload.work.companies"
                :key="index"
                class="is-capitalized"
              >
                <a
                  :href="`#${work.company
                    .replace(/\s/g, '')
                    .replace('-', '')
                    .toLowerCase()}`"
                >
                  {{ work.company }}
                </a>
              </li>
            </ul>
            <p class="menu-label">
              {{ $t('resume.education') }}
            </p>
            <ul class="menu-list">
              <li
                v-for="(education, index) in payload.education.schools"
                :key="index"
                class="is-capitalized"
              >
                <a
                  v-if="education.studyType == 'doctorate'"
                  :href="`#${education.studyType}`"
                >
                  {{ $t('resume.studyType.doctorate') }}
                </a>
                <a
                  v-if="education.studyType == 'master\'s'"
                  :href="`#${education.studyType}`"
                >
                  {{ $t('resume.studyType.masters') }}
                </a>
                <a
                  v-if="education.studyType == 'undergraduate'"
                  :href="`#${education.studyType}`"
                >
                  {{ $t('resume.studyType.undergraduate') }}
                </a>
                <a
                  v-if="education.studyType == 'technical'"
                  :href="`#${education.studyType}`"
                >
                  {{ $t('resume.studyType.technical') }}
                </a>
              </li>
              <li>
                <a href="#certificates">
                  {{ $t('resume.certification') }}
                </a>
              </li>
            </ul>
          </aside>
        </div>
        <div class="column is-four-fifths">
          <h1 id="work" class="title">
            <span class="icon mr-1">
              <font-awesome-layers class="fa-1x">
                <font-awesome-icon :icon="['far', 'building']" />
              </font-awesome-layers>
            </span>
            {{ $t('resume.work.experience') }}
          </h1>
          <hr />
          <Work
            v-for="(work, index) in payload.work.companies"
            :key="index"
            :work="work"
            :aria-colindex="index"
          />
          <h1 id="education" class="title pt-6">
            <span class="icon mr-1">
              <font-awesome-layers class="fa-1x">
                <font-awesome-icon :icon="['fas', 'graduation-cap']" />
              </font-awesome-layers>
            </span>
            {{ $t('resume.education') }}
          </h1>
          <hr />
          <Education
            v-for="(education, index) in payload.education.schools"
            :key="index"
            :education="education"
            :aria-colindex="index"
          />
          <h1 id="certificates" class="title pt-6">
            <span class="icon mr-1">
              <font-awesome-layers class="fa-1x">
                <font-awesome-icon :icon="['fas', 'certificate']" />
              </font-awesome-layers>
            </span>
            {{ $t('resume.certification') }}
          </h1>
          <hr />
          <Certificate
            v-for="(certificate, index) in payload.education.certificates"
            :key="index"
            :certificate="certificate"
            :aria-colindex="index"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import Work from '~/components/Work.vue'
import Education from '~/components/Education.vue'
import Certificate from '~/components/Certificate.vue'

@Component({
  components: {
    Work,
    Education,
    Certificate,
  },
})
export default class Resume extends Vue {
  async asyncData(ctx: any) {
    const payload = await ctx
      .$content('resume')
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
      title: 'Resume',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'A detailed resume of jesse quinn.',
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'Resume of jesse quinn',
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
          content: 'Resume of jesse quinn',
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'A detailed resume of jesse quinn.',
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
          content: 'A detailed resume of jesse quinn.',
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: 'https://jessequinn.info/resume',
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
          content: 'Resume of jesse quinn',
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'A detailed resume of jesse quinn.',
        },
      ],
    }
  }
}
</script>
