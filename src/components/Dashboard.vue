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
							v-if="!loading"
						) Run
						md-spinner(
							md-indeterminate
							v-if="loading"
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
						textarea(:value="result")
</template>

<script>
import {CC} from '@/CloudConnect'
//import predefined from './predefined'

export default {
	name: 'Dashboard',
	computed: {
		predefinedPayload () {
			return JSON.parse(this.predefined[this.action].payload)
		}
	},
	methods: {
		run () {
			const lambda = this.predefined[this.action].lambda
			const payload = this.predefinedPayload

			this.loading = true;
			this.result = null;

			CC.lambda(CC.manifest[lambda], payload)
				.then(result => {
					this.loading = false;
					this.result = JSON.stringify(result, null, 2)
				}, err => {
					this.loading = false;
					this.result = err
				})
		}
	},
	data () {
		return {
			loading: false,
			result: null,
			action: 'ThingLambda_FIND',
			
			predefined: {
				ThingLambda_FIND: {
					lambda: 'ThingLambda',
					payload: JSON.stringify({
						action: 'FIND',
						query: {
							size: 3,
							query: {
								match_all: {}
							}
						}
					}, 0, 2)
				},
				ThingLambda_GET: {
					lambda: 'ThingLambda',
					payload: JSON.stringify({
						action: 'GET',
						attributes: {
							thingName: '00000275',
							shadow: null,
							label: null
						}
					}, 0, 2)
				},
				ThingTypeLambda_GET: {
					lambda: 'ThingTypeLambda',
					payload: JSON.stringify({
						action: 'GET',
						attributes: {
							id: '83'
						}
					}, 0, 2)
				},
				ThingTypeLambda_LIST: {
					lambda: 'ThingTypeLambda',
					payload: JSON.stringify({
						action: 'LIST'
					}, 0, 2)
				},
				UserLambda_GET: {
					lambda: 'UserLambda',
					payload: JSON.stringify({
						action: 'GET',
						attributes: {
							userName: 'Pwntus',
							firstName: null,
							roleName: null
						}
					}, 0, 2)
				}
			}
		}
	},
	mounted () {
		if (!CC.manifest) {
			this.$router.push('/')
			return
		}
		this.$material.setCurrentTheme('default')

		/* Things */
		let findThingsPayload = {
			action: 'FIND',
			query: {
				size: 3,
				query: {
					match_all: {}
				}
			}
		}
		CC.lambda(CC.manifest.ThingLambda, findThingsPayload)
			.then((res) => {
				this.findThings = JSON.stringify(res, null, 2)
			})
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
