import AWS from 'aws-sdk'

class CloudConnectSession {
	
	/* Init session with manifest and a reference
	 * to the CloudCOnnect invoke function.
	 */
	constructor (manifest, invoke) {
		this.manifest = manifest
		this.invoke = invoke
		this.credentials = null
	}
	
	login (username, password) {

		/* Get AWS Cognito limited-privilege credentials
		 * since we don't have a Cloud Connect authentication
		 * token yet.
		 */
		return this.getCredentials()
			.then(credentials => {
				this.credentials = credentials

				/* Invoke a AuthLambda call to obtain an
				 * authentication token from Cloud Connect.
				 */
				const loginPayload = {
					action: 'LOGIN',
					attributes: {
						userName: username,
						password: password
					}
				}
				return this.invoke('AuthLambda', loginPayload)
			})
			.then(account => {
				this.account = account

				/* Get AWS Cognito raised privilege credential
				 * using the obtained Cloud Connect auth token.
				 */
				return this.getCredentials(account.credentials.token)
			})
			.then(credentials => {
				this.credentials = credentials
			})
	}
	
	getCredentials (token = null) {
		let credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: this.manifest.IdentityPool,
			Logins: {
				[`cognito-idp.${this.manifest.Region}.amazonaws.com/${this.manifest.UserPool}`]: token
			}
		})
		
		/* Clear previously cached ID if token is absent */
		if (!token) credentials.clearCachedId()

		return new Promise((resolve, reject) => {
			credentials.get(error => {
				error ? reject(error) : resolve(credentials)
			})
		})
	}
	
	refreshCredentials () {
		if (!this.account.credentials.refreshToken)
			throw new Error('No Refresh Token', this.account, this.credentials)
		
		this.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: this.manifest.IdentityPool
		})
		this.credentials.clearCachedId()
		
		const refreshPayload = {
			action: 'REFRESH',
			attributes: {
				refreshToken: this.account.credentials.refreshToken
			}
		}
		return this.invoke('AuthLambda', refreshPayload)
			.then(account => {
				this.account = account
				return this.getCredentials(this.account.credentials.token)
			})
			.then(credentials => {
				this.credentials = credentials
				return Promise.resolve(credentials)
			})
	}
}

export default CloudConnectSession
