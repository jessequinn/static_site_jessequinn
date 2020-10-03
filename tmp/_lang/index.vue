<template>
  <section class="hero is-fullheight">
    <div class="hero-body">
      <div class="container">
        <h1 class="title is-1">
          {{ $t('home.title') }}
        </h1>
        <p class="subtitle is-3">
          {{ $t('home.subtitle') }}
        </p>
        <p class="has-padding-top-7">
          {{ $t('home.introduction') }}
          <a href="https://m.do.co/c/6ceb645458ec" target="_blank">
            {{ $t('home.referral') }}
          </a>
          .
        </p>
        <p class="has-padding-top-7">
          {{ $t('home.subintroduction') }}
          <a href="https://scidoc.dev" target="_blank">
            {{ $t('home.company') }}
          </a>
        </p>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>

<style lang="scss" scoped></style>
