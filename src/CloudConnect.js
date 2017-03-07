import Vue from 'vue'
import AWS from 'aws-sdk'
import CloudConnectSession from './CloudConnectSession'

class CloudConnect {
	
	/* Init class with host name configured for
	 * Telenor.
	 */
	constructor () {
		this.AWS = AWS
		this.host = 'startiot.cc.telenorconnexion.com'
		this.manifest = null
		this.session = null
		this.debug = true
	}

	/* Customizable debug method */
	debugMessage(method, message) {
		if (this.debug)
			console.log('CloudConnect.' + method + ': ' + message)
	}
	
	/* Return the manifest file from full URL */
	getManifest () {
		const manifest_url = `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this.host}`
		
		return new Promise((resolve, reject) => {
			Vue.http.get(manifest_url)
				.then(response => {
					/* Parse manifest from the response
					 * and resolve.
					 */
					resolve(response.body)

				/* Reject if failed */
				}).catch(error => reject(error))
		})
	}
	
	loadManifest () {
		return new Promise((resolve, reject) => {
			this.getManifest()
				.then(manifest => {
					/* Store manifest file and set AWS instance
					 * region based on manifest.
					 */
					this.manifest = manifest
					this.AWS.config.region = manifest.Region
					
					resolve()
					
				}).catch(error => reject(error))
		})
	}
	
	/* Invoke will execute a AWS lambda function.
	 * What's special here is that it first stores the actual
	 * lambda call in an instance variable 'invoke_instace',
	 * where it will check the response status of the call.
	 * By storing the instance, we can later invoke it again
	 * if we were to refresh the session credentials.
	 */
	invoke (function_name, payload) {
		
		console.log('D')
		/* Store the lambda call instance for potetially
		 * later usage.
		 */
		const invoke_instance = () => {
			return this.lambda(function_name, payload)
		}
		
		/* Run it, but catch errors */
		return invoke_instance()
			.catch(error => {
				
				/* if we in fact got an auth error we need to
				 * refresh the session credentials.
				 */
				if (this.isAuthError(error)) {
					return this.session.refreshCredentials()
						.then(invoke_instance)
					
				/* Something else, bad, happened */
				} else {
					throw error
				}
			})
	}
	
	/* Execute a Cloud Connect Lambda function for
	 * the given 'function_name' and 'payload'.
	 */
	lambda (function_name, payload) {
		return new Promise((resolve, reject) => {
			
			this.debugMessage('lambda', function_name)
			
			let parseError = function (error) {
				if (error && error.errorMessage) { return JSON.parse(error.errorMessage) }
				else if (typeof(error) === 'string') { return JSON.parse(error) }
				else { return error }
			}

			/* Lambda parameters */
			let params = {
				FunctionName: function_name,
				Payload: JSON.stringify(payload)
			}
			
			/* Invoke the lambda function.
			 * Credentials should already be obtained by
			 * the session object.
			 */
			let lambda = new AWS.Lambda({ credentials: this.session.credentials })
			lambda.invoke(params, function (err, res) {

				/* Parse response and find out if we got a
				 * genuine error, or an expired token.
				 */
				try {
					/* Got error */
					if (err) {
						reject(parseError(err))
						
					/* Empty response */
					} else if (!res || !res.Payload) {
						reject('No data')
						
					/* No error, got a response */
					} else {
						const payload = JSON.parse(res.Payload)
						
						/* Got an error message in response */
						if (res.FunctionError || payload.errorMessage) {
							reject(parseError(payload))
							
						/* OK */
						} else {
							resolve(payload)
						}
					}
					
				/* Unexpected error */
				} catch (err) {
					reject(err)
				}
			})
		})
	}
	
	/* Function for parsing the response from a lambda
	 * function call.
	 */
	parseError (error) {
		if (error && error.errorMessage) { return JSON.parse(error.errorMessage) }
		else if (typeof(error) === 'string') { return JSON.parse(error) }
		else { return error }
	}

	/* Function to determine if an error returned by a
	 * lambda call is an authentication error.
	 */
	isAuthError (error) {
		const authErrors = /No data|Token is expired|Invalid login token|Missing credentials in config|is not authorized to perform|Not Found/

		return  (typeof error === 'string' && error.match(authErrors)) ||
				(typeof error.message === 'string' && error.message.match(authErrors))
	}
	
	/* Perform events required to authenticate with
	 * Cognito Identity against Cloud Connect and AWS.
	 * Return a Promise for event chaining.
	 */
	login (username, password) {
		return new Promise((resolve, reject) => {
			
			/* Load the manifest */
			this.loadManifest()
				.then(() => {
					console.log('A')
					
					/* Create a new Cloud Connect session with manifest
					 * and current object instance as context (the context
					 * is used by the CloudConnectSession to invoke lambda
					 * calls).
					 */
					this.session = new CloudConnectSession(this.manifest, this.invoke.bind(this))
					return this.session.login(username, password)
						
				/* Failed to load manifest */
				})
				.then(() => resolve())
				.catch(error => reject(error))
		})
	}
}

export let CC = new CloudConnect
