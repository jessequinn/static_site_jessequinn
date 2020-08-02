<template>
  <div>
    <p class="pt-3">
      <span v-if="certificate.endedAt" class="icon has-text-dark is-small">
        <font-awesome-layers class="fa-xs">
          <font-awesome-icon :icon="['fas', 'drumstick-bite']" />
        </font-awesome-layers>
      </span>
      <span v-else class="icon has-text-success is-small">
        <font-awesome-layers class="fa-xs">
          <font-awesome-icon :icon="['fas', 'brain']" />
        </font-awesome-layers>
      </span>
      <strong>{{ certificate.area }}</strong> |
      <a :href="certificate.website" target="_blank">{{
        certificate.institution
      }}</a>
    </p>
    <p class="has-text-danger">
      <small v-if="certificate.endedAt">
        {{ certificate.startedAt | formatDate('MMM. YYYY') }} -
        {{ certificate.endedAt | formatDate('MMM. YYYY') }}
        <a
          v-if="certificate.certificate"
          :href="certificate.certificate"
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
        {{ certificate.startedAt | formatDate('MMM. YYYY') }} - present
        <a
          v-if="certificate.certificate"
          :href="certificate.certificate"
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
    <p v-if="certificate.topics">
      <template v-for="t in certificate.topics">
        <span :key="t.id" class="tag is-dark">{{ t }}</span>
        &nbsp;
      </template>
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import '~/helpers/date-format'

@Component
export default class Certificate extends Vue {
  @Prop() certificate
}
</script>
