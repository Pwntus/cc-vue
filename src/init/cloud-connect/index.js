import Vue from 'vue'
import AWS from 'aws-sdk'

class CloudConnect {
	
	constructor () {
		this.AWS = AWS
		this.AWS.config.region = 'eu-west-1'
		this.manifest = null
		this.username = null
		this.password = null
		this.host = 'startiot.cc.telenorconnexion.com'
	}
	
	manifestUrl () {
		return `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this.host}`
	}
	
	getManifest () {
		return new Promise((resolve, reject) => {
			Vue.http.get(this.manifestUrl())
				.then(response => {
					
					this.manifest = response.body
					resolve()
					
				}, error => {
					reject()
				})
		})
	}
	
	lambda (function_name, payload, callback) {
		return new Promise((resolve, reject) => {
			let params = {
				FunctionName: function_name,
				Payload: JSON.stringify(payload)
			}
			let lambda = new AWS.Lambda
			lambda.invoke(params, function (err, res) {
				if (!err) {
					let pl = JSON.parse(res.Payload)
					console.log('---lambda res PL: ', pl)
					
					if (!pl.errorMessage) {
						resolve(pl)
					} else {
						alert('Lambda function returned an error: ' + pl.errorMessage)
					}
				} else {
					alert('Lambda request failed '+ err.toString())
				}
			})
		})
	}
	
	initCognito () {
		this.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: this.manifest.IdentityPool
		})
		this.AWS.config.credentials.clearCachedId()
		console.log('--- initCognito: ', this.AWS.config.credentials)
	}
	
	initAuth (res) {
		console.log('--- initAuth: ', res)
		
		const creds = res.credentials;
		this.AWS.config.credentials.params.Logins = {
			['cognito-idp.' + this.manifest.Region + '.amazonaws.com/' + this.manifest.UserPool]: creds.token
		}
		this.AWS.config.credentials.expired = true
	}
	
	login (username, password) {
		this.getManifest()
			.then(() => {
				/* Init Cognito Identity */
				this.initCognito()
				
				const loginPayload = {
					action: 'LOGIN',
					attributes: {
						userName: username,
						password: password
					}
				}
				this.lambda(this.manifest.AuthLambda, loginPayload)
					.then((res) => {
						this.initAuth(res)
						this.run()
					})
			})
	}
	
	run () {
		let findThingsPayload = {
			action: 'FIND',
			query: {
				size: 3,
				query: {
					match_all: {}
				}
			}
		}
		this.lambda(this.manifest.ThingLambda, findThingsPayload)
			.then((res) => {
				console.log(res)
			})
	}
}

export default CloudConnect
