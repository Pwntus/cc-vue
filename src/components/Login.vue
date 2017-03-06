<template lang="pug">
	md-layout(
		class="login"
		md-gutter
		md-align="center"
	)
		md-layout(
			md-flex-xsmall="100"
			md-flex-medium="40"
			md-flex-large="20"
			md-flex-xlarge="15"
		)
			md-card
				md-card-media-cover
					md-card-media
						img(src="../assets/img/login.png")
					md-card-area
						md-card-header
							div(class="md-title") CC Cognito
				md-card-content
					md-input-container
						label Username
						md-input(v-model="login.username")
					md-input-container
						label Password
						md-input(
							type="password"
							v-model="login.password"
						)
				md-card-actions
					md-button(@click.native="login") Login
</template>

<script>
export default {
	name: 'Login',
	data () {
		return {
			login: {
				username: null,
				password: null
			}
		}
	},
	methods: {
		login () {
			/* Quick input validation */
			if (this.login.username == '' || this.login.password == '') return

			console.log('d')
		}
	}
}
</script>

<style lang="scss" scoped>
.login {
	.md-card {
		width: 100%;
		margin: 5em 10px 0;
	}
}
</style>
