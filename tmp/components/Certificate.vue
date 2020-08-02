<template>
  <div>
    <p class="has-padding-top-7">
      <span
        v-if="certificate.certificate.endedAt"
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
      <strong>{{ certificate.certificate.area }}</strong> |
      <a :href="certificate.certificate.website" target="_blank">{{
        certificate.certificate.institution
      }}</a>
    </p>
    <p class="has-text-danger">
      <small v-if="certificate.certificate.endedAt">
        {{ certificate.certificate.startedAt | formatDate('MMM. YYYY') }} -
        {{ certificate.certificate.endedAt | formatDate('MMM. YYYY') }}
        <a
          v-if="certificate.certificate.certificate"
          :href="certificate.certificate.certificate"
          target="_blank"
        >
          <span class="icon is-small">
            <font-awesome-layers class="fa-xs">
              <font-awesome-icon :icon="['fas', 'paperclip']" />
            </font-awesome-layers>
          </span>
        </a>
      </small>
      <small v-else>
        {{ certificate.certificate.startedAt | formatDate('MMM. YYYY') }} -
        present
        <a
          v-if="certificate.certificate.certificate"
          :href="certificate.certificate.certificate"
          target="_blank"
        >
          <span class="icon is-small">
            <font-awesome-layers class="fa-xs">
              <font-awesome-icon :icon="['fas', 'paperclip']" />
            </font-awesome-layers>
          </span>
        </a>
      </small>
    </p>
    <p v-if="certificate.certificate.topics">
      <template v-for="t in certificate.certificate.topics">
        <span :key="t.id" class="tag is-dark">{{ t }}</span>
        &nbsp;
      </template>
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import '~/helpers/date-format'

export default Vue.extend({
  name: 'Certificate',
  // props: ["certificate"],
  props: {
    certificate: {
      type: Object,
      default() {
        return null
      },
    },
  },
})
</script>

<style scoped></style>
