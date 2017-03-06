<template lang="pug">
	pre {{ foo }}
</template>

<script>
export default {
	name: 'Dashboard',
	data () {
		return {
			foo: null
		}
	},
	mounted () {
		
		let findThingsPayload = {
			action: 'FIND',
			query: {
				size: 3,
				query: {
					match_all: {}
				}
			}
		}
		this.cc.lambda(this.cc.manifest.ThingLambda, findThingsPayload)
			.then((res) => {
				this.foo = res
			})
	}
}
</script>

<style lang="scss" scoped>
.login {
	.md-card {
		margin: 5em 10px 0;
		
		.md-spinner {
			margin: 4em auto;
		}
	}
}
</style>
