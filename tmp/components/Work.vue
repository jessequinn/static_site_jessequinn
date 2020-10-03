<template>
  <div>
    <p
      :id="work.work.company.replace(/\s/g, '').replace('-', '').toLowerCase()"
      class="has-padding-top-7"
    >
      <strong>{{ work.work.position }}</strong> |
      <a :href="work.work.website" target="_blank">{{ work.work.company }}</a>
    </p>
    <p>
      <small v-if="work.work.endedAt" class="has-text-danger">
        {{ work.work.startedAt | formatDate('MMM. YYYY') }} -
        {{ work.work.endedAt | formatDate('MMM. YYYY') }}
      </small>
      <small v-else class="has-text-danger">
        {{ work.work.startedAt | formatDate('MMM. YYYY') }}
        - present
      </small>
      <span v-if="work.work.endedAt" class="tag">
        {{ work.work.startedAt | compareDates(work.work.endedAt) }} months
      </span>
      <span v-else class="tag">
        {{ work.work.startedAt | compareDateNow }} months
      </span>
    </p>
    <p class="has-text-justified">
      {{ work.work.summary }}
    </p>
    <p v-if="work.work.highlights">
      <template v-for="h in work.work.highlights">
        <span :key="h.id" class="tag is-dark">{{ h }}</span>
        &nbsp;
      </template>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import '~/helpers/date-format'

@Component
export default class Work extends Vue {
  props: {
    work: {
      type: Object
    }
  }
}
</script>
