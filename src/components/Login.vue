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
				md-spinner(
					md-indeterminate
					v-if="loading"
				)
				md-card-content(v-if="!loading")
					md-input-container
						label Username
						md-input(v-model="username")
					md-input-container
						label Password
						md-input(
							type="password"
							v-model="password"
						)
				md-card-actions(v-if="!loading")
					md-button(@click.native="doLogin") Login
				a(
					class="attribution"
					href="http://www.freepik.com/free-vector/hexagonal-pattern_852781.htm"
					target="_new"
				) Graphics attribution
		md-snackbar(
			md-position="bottom center"
			ref="snackbar"
		)
			span {{ error }}
</template>

<script>
import {CC} from '@/CloudConnect'

export default {
	name: 'Login',
	data () {
		return {
			username: null,
			password: null,
			loading: false,
			error: null
		}
	},
	methods: {
		doLogin () {
			/* Quick input validation */
			if (this.username == '' || this.password == '') return
				
			this.loading = true

			/* Try to login with Cloud Connect */
			CC.login(this.username, this.password)
				/* Success, goto dashboard */
				.then(() => {
					this.$router.push('/dashboard')
				
				/* Fail, show snackbar */
				})
				.catch(error => {
					this.error = error
					this.$refs.snackbar.open()
					this.loading = false
				})
		}
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

		.attribution {
			padding: 10px 15px;
			font-size: 10px;
			position: absolute;
			bottom: 0;
		}
	}
}
</style>
