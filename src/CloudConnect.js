import AWS from 'aws-sdk'
import CloudConnectSession from './CloudConnectSession'

class CloudConnect {
	
	/* Init class with host name configured for
	 * Telenor Connexion/Cloud Connect/Start IoT.
	 */
	constructor () {
		this.host = 'startiot.cc.telenorconnexion.com'
		this.AWS = AWS
		this.manifest = null
		this.session = null
		this.debug = false

		/* Load AWS manifest at init */
		this.loadManifest()
			.catch(error => console.log('Could not load manifest file', error))
	}

	/* Customizable debug method */
	log(message, ...dump) {
		if (this.debug) console.log('[debug]:', message, ...dump)
	}
	
	/* Fetch manifest from correct URL */
	loadManifest () {
		const manifest_url = `https://1u31fuekv5.execute-api.eu-west-1.amazonaws.com/prod/manifest/?hostname=${this.host}`

		return fetch(manifest_url)
			.then(response => response.json())
			.then(manifest => {
				this.log('loaded manifest', manifest)
				this.manifest = manifest
				this.AWS.config.region = manifest.Region
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

		/* Store the lambda call instance for potetially
		 * later usage. A context variable to the current
		 * instance is provided to bypass cross-object
		 * hokus-pokus (when calling from the Cloud Connect
		 * session instance).
		 */
		const invoke_instance = (ctx = this) => {
			return this.lambda(function_name, payload, this)
		}
		
		/* Run it, but catch errors */
		return invoke_instance()
			.catch(error => {
				
				/* If we in fact got an auth error we need to
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
	lambda (function_name, payload, ctx = this) {
		return new Promise((resolve, reject) => {
			
			this.log('lambda.' + function_name, payload)

			/* Lambda parameters */
			let params = {
				FunctionName: ctx.manifest[function_name],
				Payload: JSON.stringify(payload)
			}
			
			/* Invoke the lambda function.
			 * Credentials should already be obtained by
			 * the session object.
			 */
			let lambda = new ctx.AWS.Lambda({ credentials: this.session.credentials })
			lambda.invoke(params, function (err, res) {

				/* Parse response and find out if we got a
				 * genuine error, or an expired token.
				 */
				try {
					/* Got error */
					if (err) {
						reject(ctx.parseError(err))
						
					/* Empty response */
					} else if (!res || !res.Payload) {
						reject('No data')
						
					/* No error, got a response */
					} else {
						const payload = JSON.parse(res.Payload)
						
						/* Got an error message in response */
						if (res.FunctionError || payload.errorMessage) {
							reject(ctx.parseError(payload))
							
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

	/* Parse different formats returned by a
	 * lambda call.
	 */
	parseError (error) {
		if (error && error.errorMessage) { return JSON.parse(error.errorMessage).message }
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
	
	/* Create a Cloud Connect session and try
	 * login with provided username / password.
	 */
	login (username, password) {
		this.session = new CloudConnectSession(this.manifest, this.invoke.bind(this))
		return this.session.login(username, password)
	}
}

export let CC = new CloudConnect
