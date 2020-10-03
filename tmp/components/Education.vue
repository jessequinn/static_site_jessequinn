<template>
  <div>
    <p :id="education.education.studyType" class="has-padding-top-7">
      <span
        v-if="education.education.endedAt"
        class="icon has-text-dark is-small"
      >
        <font-awesome-layers class="fa-xs">
          <font-awesome-icon :icon="['fas', 'drumstick-bite']" />
        </font-awesome-layers>
      </span>
      <span v-else class="icon has-text-success is-small">
        <font-awesome-layers class="fa-xs">
          <font-awesome-icon :icon="['fas', 'brain']" />
        </font-awesome-layers>
      </span>
      <strong>{{ education.education.area }}</strong>
      ,
      <strong class="is-capitalized">{{
        education.education.studyType
      }}</strong>
      |
      <a :href="education.education.website" target="_blank">{{
        education.education.institution
      }}</a>
    </p>
    <p class="has-text-danger">
      <small v-if="education.education.endedAt" class="has-text-danger">
        {{ education.education.startedAt | formatDate('MMM. YYYY') }} -
        {{ education.education.endedAt | formatDate('MMM. YYYY') }}
      </small>
      <small v-else class="has-text-danger">
        {{ education.education.startedAt | formatDate('MMM. YYYY') }} - present
      </small>
    </p>
    <p class="has-text-justified">
      {{ education.education.summary }}
    </p>
    <p v-if="education.education.courses">
      <template v-for="c in education.education.courses">
        <span :key="c.id" class="tag is-dark">{{ c }}</span>
        &nbsp;
      </template>
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import '~/helpers/date-format'

export default Vue.extend({
  name: 'Education',
  // props: ["education"],
  props: {
    education: {
      type: Object,
      default() {
        return null
      },
    },
  },
})
</script>

<style scoped></style>
