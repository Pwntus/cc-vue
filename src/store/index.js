import Vue from 'vue'
import Vuex from 'vuex'

/* Import store modules */
import app from './modules/app'

Vue.use(Vuex)

/* Instantiate a vuex store with imported modules */
export default new Vuex.Store({
	modules: {
		app
	},
	strict: process.env.NODE_ENV !== 'production'
})
