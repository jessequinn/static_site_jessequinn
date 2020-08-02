import Vue from 'vue'
import moment from 'moment'

Vue.filter('formatDate', (date: string, format: string) => {
  if (date && format) {
    return moment(date).format(format)
  } else if (date) {
    return moment(date).format('MMMM DD YYYY')
  }
})

Vue.filter('compareDates', (date: string, date2: string) => {
  if (date) {
    return moment(date2).diff(moment(date), 'months', false)
  }
})

Vue.filter('compareDateNow', (date: string) => {
  if (date) {
    return moment(new Date()).diff(moment(date), 'months', false)
  }
})
