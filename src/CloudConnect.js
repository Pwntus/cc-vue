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
		this.debug = true
	}

	debugMessage(method, message) {
		if (this.debug)
			console.log('CloudConnect.' + method + ': ' + message)
	}
	
	/* Return full manifest URL based on the host
	 * of Telenor Start IoT.
	 */
	manifestUrl () {
		return `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this.host}`
	}
	
	/* Return the manifest file, store it and return
	 * a Promise for event chaining.
	 */
	getManifest () {
		return new Promise((resolve, reject) => {
			Vue.http.get(this.manifestUrl())
				.then(response => {

					/* Get manifest from the response */
					let manifest = response.body

					/* Resolve */
					resolve(manifest)

				/* Reject */
				}, error => reject(error))
		})
	}
	
	/* Invoke a Cloud Connect Lambda function for
	 * the given 'function_name' and 'payload'.
	 * Return a Promise for event chaining by the
	 * caller.
	 */
	lambda (function_name, payload) {
		return new Promise((resolve, reject) => {
			
			this.debugMessage('lambda', function_name)

			/* Lambda parameters */
			let params = {
				FunctionName: function_name,
				Payload: JSON.stringify(payload)
			}
			
			/* Invoke the lambda function */
			let lambda = new AWS.Lambda
			lambda.invoke(params, function (err, res) {

				/* No errors, parse response */
				if (!err) {
					let pl = JSON.parse(res.Payload)
					
					/* No error message in parsed response, resolve */
					if (!pl.errorMessage) {
						resolve(pl)

					/* Error message in parsed response, reject */
					} else {
						reject(JSON.parse(pl.errorMessage).message)
					}

				/* Other, unknown error occured, reject */
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
	initAuth (response) {
		const creds = response.credentials;
		this.AWS.config.credentials.params.Logins = {
			['cognito-idp.' + this.manifest.Region + '.amazonaws.com/' + this.manifest.UserPool]: creds.token
		}
		this.AWS.config.credentials.expired = true
	}
	
	/* Perform events required to authenticate with
	 * Cognito Identity against Cloud Connect and AWS.
	 * Return a Promise for event chaining.
	 */
	login (username, password) {
		return new Promise((resolve, reject) => {

			/* Get manifest file */
			this.getManifest()

				/* Got manifest */
				.then(manifest => {

					/* Store manifest file */
					this.manifest = manifest

					/* Init Cognito Identity */
					this.initCognito()
					
					/* Invoke an AuthLambda call to Coud Connect */
					const loginPayload = {
						action: 'LOGIN',
						attributes: {
							userName: username,
							password: password
						}
					}
					this.lambda(this.manifest.AuthLambda, loginPayload)
						.then(response => {

							/* AuthLambda OK, raise authority */
							this.initAuth(response)
							
							/* We are now using Cognito Identity, resolve */
							resolve()

						/* AuthLambda failed, reject with error response */
						}, err => reject(err))

				/* Manifest retrieval failed, reject with error response */
				}, err => reject(err))
		})
	}
}

export let CC = new CloudConnect
