import Vue from 'vue'
import VueMaterial from 'vue-material'

/* Import globally used styles */
import '../assets/css/fonts_icons.css'
import '../../node_modules/vue-material/dist/vue-material.css'

Vue.use(VueMaterial)

Vue.material.registerTheme('default', {
	primary: 'light-blue',
	accent: 'blue-grey',
	warn: 'red',
	background: 'white'
})
