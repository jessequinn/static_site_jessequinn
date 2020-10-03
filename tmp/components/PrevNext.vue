<template>
  <div class="has-padding-top-4">
    <NuxtLink :to="'/blog'"> Back </NuxtLink>
    |
    <NuxtLink
      v-if="prev"
      :to="{ name: 'blog-articles-slug', params: { slug: prev.slug } }"
    >
      {{ prev.title }}
      <font-awesome-layers class="fa-1x">
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
      </font-awesome-layers>
    </NuxtLink>
    <span v-else>&nbsp;</span>
    <NuxtLink
      v-if="next"
      :to="{ name: 'blog-articles-slug', params: { slug: next.slug } }"
      class="font-bold hover:underline"
    >
      <font-awesome-layers class="fa-1x">
        <font-awesome-icon :icon="['fas', 'chevron-right']" />
      </font-awesome-layers>
      {{ next.title }}
    </NuxtLink>
    <span v-else>&nbsp;</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PrevNext',
  props: {
    prev: {
      type: Object,
      default: () => null,
    },
    next: {
      type: Object,
      default: () => null,
    },
  },
})
</script>

<style></style>
