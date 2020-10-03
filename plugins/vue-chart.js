import Vue from 'vue'
import { HorizontalBar } from 'vue-chartjs'

Vue.component('portolio-chart', {
  extends: HorizontalBar,
  // props: ['data', 'options'],
  data: () => ({
    chartdata: {
      labels: [2014, 2015, 2016, 2017, 2018, 2019, 2020],
      datasets: [
        {
          label: 'Citations',
          backgroundColor: '#f87979',
          data: [3, 21, 48, 113, 195, 174, 103],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  }),
  mounted() {
    this.renderChart(this.chartdata, this.options)
  },
})
