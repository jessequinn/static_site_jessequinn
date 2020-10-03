<template>
  <div>
    <input
      v-model="searchQuery"
      class="input"
      type="search"
      autocomplete="off"
      placeholder="Search Articles"
    />
    <div class="content">
      <ol v-if="articles.length" type="1">
        <li v-for="article of articles" :key="article.slug">
          <NuxtLink
            :to="{ name: 'blog-articles-slug', params: { slug: article.slug } }"
          >
            {{ article.title }}
          </NuxtLink>
        </li>
      </ol>
    </div>
  </div>
</template>

<script lang="js">

export default {
  data() {
    return {
      searchQuery: '',
      articles: [],
    }
  },
  watch: {
    async searchQuery(searchQuery) {
      if (!searchQuery) {
        this.articles = []
        return
      }
      this.articles = await this.$content('articles')
        .search('title', searchQuery)
        .fetch()
    },
  },
}
</script>
