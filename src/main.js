import Vue from 'vue'
import VueResource from 'vue-resource'
import VueMaterial from 'vue-material'
import router from '@/router'
import App from '@/components/App'

/* Import globally used styles */
import '@/assets/css/fonts_icons.css'
import '../node_modules/vue-material/dist/vue-material.css'

/* Tell Vue to use imported modules */
Vue.use(VueResource)
Vue.use(VueMaterial)

/* Register a default material theme */
Vue.material.registerTheme('default', {
	primary: 'light-blue',
	accent: 'blue',
	warn: 'red'
})

/* The main Vue instance */
new Vue({
	router,
	render: h => h(App)
}).$mount('#app')
