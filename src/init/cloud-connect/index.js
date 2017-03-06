import Vue from 'vue'
import AWS from 'aws-sdk'

class CloudConnect {
	
	/* Init class with configuration for Telenor
	 * Start IoT.
	 */
	constructor () {
		this.AWS = AWS
		this.AWS.config.region = 'eu-west-1'
		this.host = 'startiot.cc.telenorconnexion.com'
		this.manifest = null
		this.username = null
		this.password = null
	}
	
	/* Return full manifest URL based on the host
	 * of Telenor Start IoT.
	 */
	manifestUrl () {
		return `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this.host}`
	}
	
	/* Return the manifest file, store in and return
	 * a Promise.
	 */
	getManifest () {
		return new Promise((resolve, reject) => {
			Vue.http.get(this.manifestUrl())
				.then(response => {
					
					/* Store manifest file */
					this.manifest = response.body
					
					/* Resolve */
					resolve()
				}, error => reject(error))
		})
	}
	
	/* Invoke a Cloud Connect Lambda function for
	 * the given function_name and payload.
	 * Return a Promise.
	 */
	lambda (function_name, payload) {
		return new Promise((resolve, reject) => {
			
			/* Lambda paramters */
			let params = {
				FunctionName: function_name,
				Payload: JSON.stringify(payload)
			}
			
			/* Invoke the lambda function */
			let lambda = new AWS.Lambda
			lambda.invoke(params, function (err, res) {
				if (!err) {
					let pl = JSON.parse(res.Payload)
					
					if (!pl.errorMessage) {
						resolve(pl)
					} else {
						reject(pl.errorMessage)
					}
				} else {
					reject(err.toString())
				}
			})
		})
	}
	
	/* Configure AWS instance with required info
	 * from manifest file.
	 */
	initCognito () {
		this.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: this.manifest.IdentityPool
		})
		this.AWS.config.credentials.clearCachedId()
	}
	
	/* Configure AWS instance with raised authority,
	 * after a login lambda call.
	 */
	initAuth (res) {
		const creds = res.credentials;
		this.AWS.config.credentials.params.Logins = {
			['cognito-idp.' + this.manifest.Region + '.amazonaws.com/' + this.manifest.UserPool]: creds.token
		}
		this.AWS.config.credentials.expired = true
	}
	
	login (username, password) {
		return new Promise((resolve, reject) => {
			this.getManifest()
				.then(() => {
					/* Init Cognito Identity */
					this.initCognito()
					
					/* Invoke a AuthLambda call to Coud Connect */
					const loginPayload = {
						action: 'LOGIN',
						attributes: {
							userName: username,
							password: password
						}
					}
					this.lambda(this.manifest.AuthLambda, loginPayload)
						.then(res => {
							/* Init raised authority */
							this.initAuth(res)
							
							resolve()
						}, err => {
							reject(err)
						})
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
