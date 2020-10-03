import Vue from 'vue'
import moment from 'moment'

Vue.filter('formatDate', (date: string, format: string) => {
  if (date && format) {
    return moment(date).format(format)
  } else if (date) {
    return moment(date).format('MMMM DD YYYY')
  }
})

Vue.filter('compareDates', (startDate: string, endDate: string) => {
  if (startDate) {
    return moment(new Date(endDate)).diff(moment(startDate), 'months', false)
  }
})

Vue.filter('compareDateNow', (startDate: string) => {
  if (startDate) {
    return moment(new Date()).diff(moment(startDate), 'months', false)
  }
})
