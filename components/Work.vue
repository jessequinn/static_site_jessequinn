<template>
  <div>
    <p
      :id="work.company.replace(/\s/g, '').replace('-', '').toLowerCase()"
      class="pt-2"
    >
      <strong>{{ work.position }}</strong> |
      <a :href="work.website" target="_blank">{{ work.company }}</a>
    </p>
    <p>
      <small v-if="work.endedAt" class="has-text-danger">
        {{ work.startedAt | formatDate('MMM. YYYY') }} -
        {{ work.endedAt | formatDate('MMM. YYYY') }}
      </small>
      <small v-else class="has-text-danger">
        {{ work.startedAt | formatDate('MMM. YYYY') }}
        - present
      </small>
      <span v-if="work.endedAt" class="tag">
        {{ work.startedAt | compareDates(work.endedAt) }} months
      </span>
      <span v-else class="tag">
        {{ work.startedAt | compareDateNow }} months
      </span>
    </p>
    <p class="has-text-justified">
      {{ work.summary }}
    </p>
    <p v-if="work.highlights">
      <template v-for="h in work.highlights">
        <span :key="h.id" class="tag is-dark">{{ h }}</span>
        &nbsp;
      </template>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import '~/helpers/date-format'

@Component
export default class Work extends Vue {
  @Prop() work
}
</script>
