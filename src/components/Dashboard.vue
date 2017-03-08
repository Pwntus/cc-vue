<template lang="pug">
	md-layout(
		class="dashboard"
		md-gutter
	)
		md-layout(
			md-column
			md-gutter
		)
			md-layout
				md-card
					md-card-header
						div(class="md-title") {{ this.predefined[this.action].lambda }} API
					md-card-content
						md-input-container
							label(for="action") Action
							md-select(
								name="action"
								v-model="action"
							)
								md-subheader ThingLambda
								md-option(value="ThingLambda_FIND") FIND
								md-option(value="ThingLambda_GET") GET

								md-subheader ThingTypeLambda
								md-option(value="ThingTypeLambda_GET") GET
								md-option(value="ThingTypeLambda_LIST") LIST

								md-subheader UserLambda
								md-option(value="UserLambda_GET") GET

						md-input-container
							label Payload
							md-textarea(v-model="predefined[action].payload")
						md-button(
							class="md-accent md-raised"
							@click.native="run"
							v-if="!ui.loading"
						) Run
						md-spinner(
							md-indeterminate
							v-if="ui.loading"
						)
					md-card-header
						div(class="md-title") ObservationLambda API
					md-card-content
						md-input-container
							label Action
							md-input(
								disabled
								value="FIND"
							)
						md-input-container
							label Query
							md-textarea(v-model="predefined.ObservationLambda_GET.payload")
						md-button(
							class="md-accent md-raised"
							@click.native="runObservation"
							v-if="!ui.loading_observation"
						) Run
						md-spinner(
							md-indeterminate
							v-if="ui.loading_observation"
						)
		md-layout(
			md-column
			md-gutter
		)
			md-layout
				md-card(class="result")
					md-card-header
						div(class="md-title") Result
					md-card-content
						textarea(
							:value="result"
							v-if="!ui.show_observation"
						)
						div(v-if="ui.show_observation && !ui.loading_observation")
							histogram(
								:chart-data="chartData"
							)
		md-snackbar(
				md-position="bottom center"
				ref="snackbar"
			)
				span {{ error }}
</template>

<script>
import {CC} from '@/CloudConnect'
import Histogram from './Histogram'
import predefined from './Predefined'

export default {
	name: 'Dashboard',
	components: { Histogram },
	methods: {

		/* Run example API */
		run () {
			const lambda = this.predefined[this.action].lambda
			const payload = this.tryParse(this.predefined[this.action].payload)
			if (!payload) return

			this.ui.loading = true;
			this.ui.show_observation = false
			this.result = null;

			CC.invoke(lambda, payload)
				.then(result => {
					this.ui.loading = false;
					this.result = JSON.stringify(result, null, 2)
				}, error => {
					this.ui.loading = false;
					this.result = error
				})
		},
		
		/* Run Elasticsearch query */
		runObservation () {
			const lambda = 'ObservationLambda'
			const payload = this.tryParse(this.predefined.ObservationLambda_GET.payload)
			if (!payload) return

			this.ui.loading_observation = true;
			this.ui.show_observation = true
			this.result = null;

			CC.invoke(lambda, payload)
				.then(result => {
					this.ui.loading_observation = false;
					this.result = JSON.stringify(result, null, 2)
					try {
						this.parseObservation(result)
					} catch (e) {
						this.error = e.message
						this.$refs.snackbar.open()
					}
				}, error => {
					this.ui.loading_observation = false;
					this.result = error
				})
		},

		tryParse (source) {
			try {
				return JSON.parse(source)
			} catch (e) {
				this.error = e.message
				this.$refs.snackbar.open()
			}
		},

		parseObservation (result) {
			if (result._shards.successful < 1) return

			let chart_labels = []
			let chart_dataset = []
			const buckets = result.aggregations.hist.buckets
			buckets.forEach(bucket => {
				chart_labels.push(bucket.key_as_string)
				chart_dataset.push(bucket.lsnr.value)
			})

			this.chartData.labels = chart_labels
			this.chartData.datasets = [{
				label: 'LSNR',
				data: chart_dataset,
				backgroundColor: '#2196f3'
			}]
		}
	},
	data () {
		return {
			ui: {
				loading: false,
				loading_observation: false,
				show_observation: false
			},
			chartData: {
				labels: null,
				datasets: null
			},
			error: null,
			result: null,
			action: 'ThingLambda_FIND',

			predefined,
		}
	},
	mounted () {
		if (!CC.manifest) {
			this.$router.push('/')
			return
		}
	}
}
</script>

<style lang="scss" scoped>
.dashboard {
	min-height: 100%;

	.md-card {
		width: 100%;
		margin: 10px;

		textarea {
			font-family: monospace;
			font-size: 12px;
		}

		&.result {
			

			.md-card-content {
				height: 100%;

				textarea {
					width: 100%;
					height: 100%;
					border: 0;
					outline: 0;
				}
			}
		}
	}
}
</style>
