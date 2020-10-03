export const state = () => ({
  locales: ['en', 'pt'],
  locale: 'en',
})

export const mutations = {
  SET_LANG(state, locale) {
    if (state.locales.includes(locale)) {
      state.locale = locale
    }
  },
}
