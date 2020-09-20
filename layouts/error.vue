<template>
  <section class="section is-large">
    <div class="columns is-multiline is-centered">
      <div class="column is-7">
        <h1 v-if="error.statusCode === 404" class="title is-1">404</h1>
        <h1 v-else class="title is-1">500</h1>
        <p v-if="error.statusCode === 404" class="subtitle is-3">
          Page not found
        </p>
        <p v-else class="subtitle is-3">Error</p>
        <p class="pb-4">
          {{ error.message }}
        </p>
        <a class="button is-primary" href="/">Back to homepage</a>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Error',
  props: {
    error: {
      type: Object,
      required: true,
    },
  },
  layout: 'blog', // you can set a custom layout for the error page
})
</script>
