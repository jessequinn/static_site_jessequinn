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
              <li v-for="work in works" :key="work.id" class="is-capitalized">
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
                v-for="education in educations"
                :key="education.id"
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
              <li v-if="certificates">
                <a href="#certificates">
                  {{ $t('resume.certification') }}
                </a>
              </li>
            </ul>
          </aside>
        </div>
        <div class="column is-four-fifths">
          <h1 class="title">
            <span class="icon has-margin-right-7">
              <font-awesome-layers class="fa-1x">
                <font-awesome-icon :icon="['far', 'building']" />
              </font-awesome-layers>
            </span>
            {{ $t('resume.work.experience') }}
          </h1>
          <hr />
          <Work
            v-for="(work, index) in worksWithGuid"
            :key="work.key"
            :work="work"
            :aria-colindex="index"
          />
          <h1 class="title has-padding-top-3">
            <span class="icon has-margin-right-7">
              <font-awesome-layers class="fa-1x">
                <font-awesome-icon :icon="['fas', 'graduation-cap']" />
              </font-awesome-layers>
            </span>
            {{ $t('resume.education') }}
          </h1>
          <hr />
          <Education
            v-for="(education, index) in educationsWithGuid"
            :key="education.key"
            :education="education"
            :aria-colindex="index"
          />
          <h1 id="certificates" class="title has-padding-top-3">
            <span class="icon has-margin-right-7">
              <font-awesome-layers class="fa-1x">
                <font-awesome-icon :icon="['fas', 'certificate']" />
              </font-awesome-layers>
            </span>
            {{ $t('resume.certification') }}
          </h1>
          <hr class="my-2" />
          <Certificate
            v-for="(certificate, index) in certificatesWithGuid"
            :key="certificate.key"
            :certificate="certificate"
            :aria-colindex="index"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="js">
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import Certificate from '@/components/Certificate.vue'
import Work from '@/components/Work.vue'
import Education from '@/components/Education.vue'

export default {
  name: 'Resume',
  components: { Certificate, Work, Education },
  props: {},
  async asyncData (ctx) {
    return {
      certificates: await ctx.app.$certificateRepository.index().catch(() => {
        ctx.error({ statusCode: 404, message: 'Certificates not found.' })
      }),
      works: await ctx.app.$workRepository.index().catch(() => {
        ctx.error({ statusCode: 404, message: 'Works not found.' })
      }),
      educations: await ctx.app.$educationRepository.index().catch(() => {
        ctx.error({ statusCode: 404, message: 'Educations not found.' })
      })
    }
  },
  data () {
    return {
      certificates: [],
      works: [],
      educations: []
    }
  },
  computed: {
    certificatesWithGuid () {
      return this.getCertificates().map((certificate) => {
        return { certificate, key: uuidv4() }
      })
    },
    worksWithGuid () {
      return this.getWorks().map((work) => {
        return { work, key: uuidv4() }
      })
    },
    educationsWithGuid () {
      return this.getEducations().map((education) => {
        return { education, key: uuidv4() }
      })
    }
  },
  methods: {
    getCertificates () {
      return _.orderBy(this.certificates, 'startedAt', 'desc')
    },
    getWorks () {
      return _.orderBy(this.works, 'startedAt', 'desc')
    },
    getEducations () {
      return _.orderBy(this.educations, 'startedAt', 'desc')
    }
  },
  head () {
    return {
      title: 'Resume',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'A detailed resume of jesse quinn.'
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'Resume of jesse quinn'
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
          content: 'Resume of jesse quinn'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'A detailed resume of jesse quinn.'
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content: 'https://jessequinn.info' + require('assets/images/john-jennings-fg7J6NnebBc-unsplash.jpg')
        },
        {
          hid: 'description',
          name: 'description',
          content: 'A detailed resume of jesse quinn.'
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: 'https://jessequinn.info/resume'
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: 'https://jessequinn.info' + require('assets/images/john-jennings-fg7J6NnebBc-unsplash.jpg')
        },
        {
          hid: 'og:site_name',
          name: 'og:site_name',
          content: 'jessequinn.info'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Resume of jesse quinn'
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'A detailed resume of jesse quinn.'
        }
      ]
    }
  }
}
</script>
