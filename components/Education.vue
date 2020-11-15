<template>
  <div>
    <p :id="education.studyType" class="pt-2">
      <span v-if="education.endedAt" class="icon has-text-dark is-small">
        <font-awesome-layers class="fa-xs">
          <font-awesome-icon :icon="['fas', 'drumstick-bite']" />
        </font-awesome-layers>
      </span>
      <span v-else class="icon has-text-success is-small">
        <font-awesome-layers class="fa-xs">
          <font-awesome-icon :icon="['fas', 'brain']" />
        </font-awesome-layers>
      </span>
      <strong>{{ education.area }}</strong
      >,
      <strong class="is-capitalized">{{ education.studyType }}</strong>
      |
      <a :href="education.website" target="_blank">{{
        education.institution
      }}</a>
    </p>
    <p class="has-text-danger">
      <small v-if="education.endedAt" class="has-text-danger">
        {{ education.startedAt | formatDate('MMM. YYYY') }} -
        {{ education.endedAt | formatDate('MMM. YYYY') }}
      </small>
      <small v-else class="has-text-danger">
        {{ education.startedAt | formatDate('MMM. YYYY') }} - present
      </small>
    </p>
    <p class="has-text-justified">
      {{ education.summary }}
    </p>
    <div v-if="education.courses" class="tags">
      <template v-for="c in education.courses">
        <span :key="c.id" class="tag is-dark">{{ c }}</span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import '~/helpers/date-format'

@Component
export default class Education extends Vue {
  @Prop() education
}
</script>
