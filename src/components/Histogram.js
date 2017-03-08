import { Line, mixins } from 'vue-chartjs/es'

export default Line.extend({
	mixins: [mixins.reactiveProp],
	props: ['options'],
	mounted () {
		this.renderChart(this.chartData, this.options)
	}
})