import Vue from 'vue'
import VueResource from 'vue-resource'
import router from './router'
import store from './store'
import App from './App'

/* Initial tasks */
Vue.use(VueResource)
Vue.config.productionTip = false
import './init/'

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app')

// Graphics
// <a href='http://www.freepik.com/free-vector/hexagonal-pattern_852781.htm'>Designed by Freepik</a>
