<template>
  <div class="row columns">
    <div class="column is-four-fifths">
      <section class="hero">
        <div class="hero-body">
          <div class="container">
            <template v-for="i in Math.ceil(sortNonFeatured.length / 2)">
              <section :key="`${i}-${rndStr(5)}`" class="section">
                <div class="columns is-variable is-8">
                  <template
                    v-for="(item, item_index) in sortNonFeatured.slice(
                      (i - 1) * 2,
                      i * 2,
                    )"
                  >
                    <div
                      v-if="item_index == 0"
                      :key="`${item_index}-${rndStr(5)}`"
                      class="column is-5 is-offset-1"
                    >
                      <h2 class="subtitle is-5 has-text-grey">
                        {{ item.updatedAt | formatDate('MMMM DD YYYY') }}
                      </h2>
                      <h1 class="title has-text-black is-3">
                        <nuxt-link :to="'/blog/articles/' + item.id">
                          {{ item.title }}
                        </nuxt-link>
                      </h1>
                      <p class="has-text-dark">
                        {{ item.abstract }}
                      </p>
                    </div>
                    <div
                      v-else
                      :key="`${item_index}-${rndStr(5)}`"
                      class="column is-5"
                    >
                      <div class="content is-medium">
                        <h2 class="subtitle is-5 has-text-grey">
                          {{ item.updatedAt | formatDate('MMMM DD, YYYY') }}
                        </h2>
                        <h1 class="title has-text-black is-3">
                          <nuxt-link :to="'/blog/articles/' + item.id">
                            {{ item.title }}
                          </nuxt-link>
                        </h1>
                        <p class="has-text-dark">
                          {{ item.abstract }}
                        </p>
                      </div>
                    </div>
                  </template>
                </div>
              </section>
              <div
                v-if="i < last"
                :key="i"
                class="is-divider is-hidden-touch"
              />
            </template>
          </div>
        </div>
      </section>
    </div>
    <div class="column">
      <aside class="menu is-hidden-touch">
        <p class="menu-label">Tags</p>
        <ul class="menu-list">
          <li v-for="(val, key) in tags" :key="`${key}-${rndStr(5)}`">
            <a href="#">{{ val }}</a>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OldSidear',
}
</script>

<style scoped></style>
