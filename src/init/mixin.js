import Vue from 'vue'
import CloudConnect from './cloud-connect'

Vue.mixin({
	data () {
		return {
			cc: new CloudConnect(this)
		}
	}
})
