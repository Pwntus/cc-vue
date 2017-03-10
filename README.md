# cc-frontend-vue

> Frontend Cloud Connect Cognito authentication using Vue.js 2

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

# What is this?

This is a frontend example written in [Vue.js 2](https://vuejs.org/) which demonstrates how to obtain a Cognito Identity and execute lambda API calls. It has two main components; **Login** and **Dashboard**.

* Login

	A login form where the user can provide Cloud Connect credentials.

* Dashboard

    Allow the authenticated user to call some predefined Cloud Connect API functions (lambda functions) with editable example payload.

## The Cloud Connect class

The class can be found in [src/CloudConnect.js](src/CloudConnect.js) and is a simplified class for performing AWS Cognito identification flows. It should be well documented and easy to follow on every step. Some prior knowledge with JavaScript ES6 is required.

### Authentication

A user can obtain a Cognito Identity by calling the function `CloudConnect.login()`. The login function returns a Promise which can be used to take appropriate action depending on the outcome.

**Example**
```javascript
let CC = new CloudConnect
CC.login('JohnDoe', '********')
.then(() => {
    // Successful login
}).catch(error => {
    // Fail with message 'error'
})
```

### Performing Cloud Connect lambda API calls

When a user is authenticated and has a valid Cognito Identity, the `CloudConnect.invoke()` function can be used to directly invoke Cloud Connect API calls.

```javascript
invoke (function_name, payload)
```
Where:

`function_name` - The lambda function name (e.g. 'ThingLambda', obtained in the Cloud Connect technical specification).

`payload` - a JavaScript Object containing the API payload (e.g. an Elasticsearch query).

**Example**

```javascript
// Execute an Elasticsearch query using the ObservationLambda API

const query = {
  action: 'FIND',
  query: {
    size: 1,
    query: { /*...*/ },
    aggs: { /*...*/ }
  }
}

CC.invoke('ObservationLambda', query)
.then(result => {
    // Successful, return data in 'result'
}).catch(error => {
    // Fail with message 'error'
})
```

## AWS Cognito authentication flow

There are basically three steps during Cognito identification:

  1. Credentials are retrieved from STS Web Identity Federation by the AWS Cognito Identity service `AWS.CognitoIdentityCredentials`. The `IdentityPoolId` is obtained from the Cloud Connect manifest file.

  ```javascript
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: this.manifest.IdentityPool
  })
  AWS.config.credentials.get()
  // ...
  ```

  2. We now have some very basic credentials needed to invoke the `AuthLambda` function with the Cloud Connect username and password. The `AuthLambda` function will return the account data and a token.

  ```javascript
  CC.invoke('AuthLambda', loginPayload)
  .then(account => {
    cloudConnectToken = account.credentials.token
  })
  // ...
  ```

  3. Call the AWS Cognito Identity service again, now with the obtained Cloud Connect token, to retrieve privileged Cognito credentials.

  ```javascript
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: this.manifest.IdentityPool,
    Logins: {
      [`cognito-idp.${this.manifest.Region}.amazonaws.com/${this.manifest.UserPool}`]: cloudConnectToken
    }
  })
  AWS.config.credentials.get()
  // ...
  ```

The privileged Cognito credentials are saved and provided each time an AWS lambda function is called.
