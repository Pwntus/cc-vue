import Vue from 'vue'
import AWS from 'aws-sdk'

class CloudConnectSession {
	
	/* Init session with manifest and context of
	 * the CloudConnect object. The context is used
	 * to invoke lambda calls (which is defined in
	 * the CloudConnect class).
	 */
	constructor (manifest, invoke) {
		this.manifest = manifest
		this.invoke = invoke
		this.credentials = null
		console.log('B')
	}
	
	/*
	 */
	login (username, password) {
		
		return new Promise((resolve, reject) => {
			
			this.getCredentials(null)
				.then(credentials => {
					
					this.credentials = credentials
					
					const loginPayload = {
						action: 'LOGIN',
						attributes: {
							userName: username,
							password: password
						}
					}
					return this.invoke(this.manifest.AuthLambda, loginPayload)
				})
				.then(account => {
					this.account = account
					return this.getCredentials(account.credentials.token)
				})
				.then(credentials => {
					this.credentials = credentials
					
					resolve()
				})
				.catch(error => reject(error))
		})
	}
	
	getCredentials (token) {
		let credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: this.manifest.IdentityPool,
			Logins: {
				[`cognito-idp.${this.manifest.Region}.amazonaws.com/${this.manifest.UserPool}`]: token
			}
		})
		
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
		return this.invoke(this.manifest.AuthLambda, refreshPayload)
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
