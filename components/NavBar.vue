<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <nuxt-link class="navbar-item is-hidden-touch" :to="$i18n.path('')">
        <font-awesome-layers class="fa-3x">
          <font-awesome-icon :icon="['fas', 'smile-wink']" />
        </font-awesome-layers>
      </nuxt-link>
      <!--      <a class="navbar-item is-hidden-desktop" href="#" target="_blank">-->
      <!--        {% if p.network == 'github' %}-->
      <!--        <i class="fab fa-github"></i>-->
      <!--        {% elseif p.network == 'linkedin' %}-->
      <!--        <i class="fab fa-linkedin-in"></i>-->
      <!--        {% elseif p.network == 'researchgate' %}-->
      <!--        <i class="fab fa-researchgate"></i>-->
      <!--        {% elseif p.network == 'orcid' %}-->
      <!--        <i class="fab fa-orcid"></i>-->
      <!--        {% elseif p.network == 'google-scholar' %}-->
      <!--        <i class="ai ai-google-scholar ai-1x"></i>-->
      <!--        {% elseif p.network == 'lattes' %}-->
      <!--        <i class="ai ai-lattes ai-1x"></i>-->
      <!--        {% endif %}-->
      <!--      </a>-->
      <a class="navbar-item is-hidden-desktop" href="mailto:me@jessequinn.info">
        <font-awesome-layers class="fa-1x">
          <font-awesome-icon :icon="['fas', 'at']" />
        </font-awesome-layers>
      </a>
      <!--      <a class="navbar-item is-hidden-desktop" href="/feed/articles/feed.json">-->
      <!--        <font-awesome-layers class="fa-1x">-->
      <!--          <font-awesome-icon :icon="['fas', 'rss']" />-->
      <!--        </font-awesome-layers>-->
      <!--      </a>-->
      <a
        class="navbar-item is-hidden-desktop"
        href="https://github.com/jessequinn"
        target="_blank"
      >
        <font-awesome-layers class="fa-1x">
          <font-awesome-icon :icon="['fab', 'github']" />
        </font-awesome-layers>
      </a>
      <a
        class="navbar-item is-hidden-desktop"
        href="https://www.linkedin.com/in/jessequinn"
        target="_blank"
      >
        <font-awesome-layers class="fa-1x">
          <font-awesome-icon :icon="['fab', 'linkedin-in']" />
        </font-awesome-layers>
      </a>
      <a
        class="navbar-item is-hidden-desktop"
        href="https://www.researchgate.net/profile/Jesse_Quinn3"
        target="_blank"
      >
        <font-awesome-layers class="fa-1x">
          <font-awesome-icon :icon="['fab', 'researchgate']" />
        </font-awesome-layers>
      </a>
      <a
        class="navbar-item is-hidden-desktop"
        href="https://orcid.org/0000-0002-9951-0443"
        target="_blank"
      >
        <font-awesome-layers class="fa-1x">
          <font-awesome-icon :icon="['fab', 'orcid']" />
        </font-awesome-layers>
      </a>
      <a
        class="navbar-item is-hidden-desktop"
        href="https://scholar.google.com/citations?user=593896883010054896"
        target="_blank"
      >
        <i class="ai ai-google-scholar ai-1x" />
      </a>
      <a
        class="navbar-item is-hidden-desktop"
        href="http://lattes.cnpq.br/4731056259867186"
        target="_blank"
      >
        <i class="ai ai-lattes ai-1x" />
      </a>
      <div class="navbar-burger burger" data-target="navMenubd-example">
        <span />
        <span />
        <span />
      </div>
    </div>
    <div id="navMenubd-example" class="navbar-menu">
      <div class="navbar-start">
        <nuxt-link class="navbar-item" :to="$i18n.path('resume')">
          {{ $t('links.resume') }}
        </nuxt-link>
        <nuxt-link class="navbar-item" :to="$i18n.path('publications')">
          {{ $t('links.publications') }}
        </nuxt-link>
        <nuxt-link class="navbar-item" :to="$i18n.path('blog')">
          {{ $t('links.blog') }}
        </nuxt-link>
      </div>
      <div class="navbar-end">
        <a class="navbar-item is-hidden-touch" href="mailto:me@jessequinn.info">
          <font-awesome-layers class="fa-1x">
            <font-awesome-icon :icon="['fas', 'at']" />
          </font-awesome-layers>
        </a>
        <!--        <a-->
        <!--          class="navbar-item is-hidden-touch"-->
        <!--          href="/feed/articles/feed.json"-->
        <!--          target="_blank"-->
        <!--        >-->
        <!--          <font-awesome-layers class="fa-1x">-->
        <!--            <font-awesome-icon :icon="['fas', 'rss']" />-->
        <!--          </font-awesome-layers>-->
        <!--        </a>-->
        <a
          class="navbar-item is-hidden-touch"
          href="https://github.com/jessequinn"
          target="_blank"
        >
          <font-awesome-layers class="fa-1x">
            <font-awesome-icon :icon="['fab', 'github']" />
          </font-awesome-layers>
        </a>
        <a
          class="navbar-item is-hidden-touch"
          href="https://www.linkedin.com/in/jessequinn"
          target="_blank"
        >
          <font-awesome-layers class="fa-1x">
            <font-awesome-icon :icon="['fab', 'linkedin-in']" />
          </font-awesome-layers>
        </a>
        <a
          class="navbar-item is-hidden-touch"
          href="https://www.researchgate.net/profile/Jesse_Quinn3"
          target="_blank"
        >
          <font-awesome-layers class="fa-1x">
            <font-awesome-icon :icon="['fab', 'researchgate']" />
          </font-awesome-layers>
        </a>
        <a
          class="navbar-item is-hidden-touch"
          href="https://orcid.org/0000-0002-9951-0443"
          target="_blank"
        >
          <font-awesome-layers class="fa-1x">
            <font-awesome-icon :icon="['fab', 'orcid']" />
          </font-awesome-layers>
        </a>
        <a
          class="navbar-item is-hidden-touch"
          href="https://scholar.google.com/citations?user=593896883010054896"
          target="_blank"
        >
          <i class="ai ai-google-scholar ai-1x" />
        </a>
        <a
          class="navbar-item is-hidden-touch"
          href="http://lattes.cnpq.br/4731056259867186"
          target="_blank"
        >
          <i class="ai ai-lattes ai-1x" />
        </a>
        <!--        {% set profiles = profiles() %}-->
        <!--        {% for p in profiles['profiles'] %}-->
        <!--        <a class="navbar-item is-hidden-touch" href="{{ p.url }}" target="_blank">-->
        <!--          {% if p.network == 'github' %}-->
        <!--          <i class="fab fa-github"></i>-->
        <!--          {% elseif p.network == 'linkedin' %}-->
        <!--          <i class="fab fa-linkedin-in"></i>-->
        <!--          {% elseif p.network == 'researchgate' %}-->
        <!--          <i class="fab fa-researchgate"></i>-->
        <!--          {% elseif p.network == 'orcid' %}-->
        <!--          <i class="fab fa-orcid"></i>-->
        <!--          {% elseif p.network == 'google-scholar' %}-->
        <!--          <i class="ai ai-google-scholar ai-1x"></i>-->
        <!--          {% elseif p.network == 'lattes' %}-->
        <!--          <i class="ai ai-lattes ai-1x"></i>-->
        <!--          {% endif %}-->
        <!--        </a>-->
        <!--        {% endfor %}-->
        <!--        <div class="navbar-item has-dropdown is-hoverable">-->
        <!--          <a class="navbar-link">-->
        <!--            <font-awesome-layers class="fa-1x">-->
        <!--              <font-awesome-icon :icon="['fas', 'globe']" />-->
        <!--            </font-awesome-layers>-->
        <!--          </a>-->
        <!--          <div class="navbar-dropdown">-->
        <!--            <NuxtLink-->
        <!--              v-if="$i18n.locale === 'en'"-->
        <!--              :to="`/pt` + $route.fullPath"-->
        <!--              class="navbar-item"-->
        <!--              active-class="none"-->
        <!--              exact-->
        <!--            >-->
        <!--              {{ $t('links.portuguese') }}-->
        <!--            </NuxtLink>-->
        <!--            <NuxtLink-->
        <!--              v-else-->
        <!--              :to="$route.fullPath.replace(/^\/[^\/]+/, '')"-->
        <!--              class="navbar-item"-->
        <!--              active-class="none"-->
        <!--              exact-->
        <!--            >-->
        <!--              {{ $t('links.english') }}-->
        <!--            </NuxtLink>-->
        <!--          </div>-->
        <!--        </div>-->
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'NavBar',
  components: {},
})
</script>
