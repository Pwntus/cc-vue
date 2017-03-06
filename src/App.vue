<template lang="pug">
	div(id="app")
		router-view
</template>

<script>
export default {
	name: 'app',
	mounted () {
		this.$material.setCurrentTheme('default')
	}
}
</script>

<style lang="scss">
* {
	margin: 0;
	padding: 0;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

body {
	background: #f8f8f8 !important;
}
</style>
