# demo-back

## Usage

> :warning: This Node.js app uses MongoDB replica sets (in order to watch events from Mongo database):
> https://docs.mongodb.com/manual/tutorial/deploy-replica-set-for-testing/
> Be sure to have MongoDB set up accordingly before running the project.

<br/><br/>
**Pull project in a dedicated folder**

Example :

```shell
git init
git remote add origin https://github.com/XSL-Labs/demo-back.git
git pull origin main
```

<br/><br/>
**Install npm modules**

```shell
npm install
```

<br/><br/>
**Create _config.env_ file in the root of project folder**
File should contain environment variables like below :

```shell
PORT=5001
DATABASE_LOCAL=<MONGO_DATABASE_ENDPOINT>
VERIFIABLE_CREDENTIALS=<VCs_YOU_WANT_TO_CHECK>
CALLBACK_URL=<VP_CALLBACK_URL>
CORS=<FRONTEND_CORS>
ADMINS_DID=<YOUR_ADMINS_DID>

WEB3_GIVEN_PROVIDER=https://data-seed-prebsc-1-s1.binance.org:8545/
SMART_CONTRACT_ADDRESS=0x6828adf1aED03be429eE42053a4F72CDd3c70846

JWT_SECRET=<YOUR_JWT_SECRET>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
```
> - **PORT** : Server port used.
> - **DATABASE_LOCAL** : Mongo database endpoint for reaching collections.
> _Example for local db : mongodb://localhost:27018/demo_
> - **VERIFIABLE_CREDENTIALS** : Verifiable credentials to be checked during authentication
> _Example : email,givenName_
> - **CALLBACK_URL** : Callback URL where verifiable presentation will be sent from mobile application (pointing to this Node.js app).
> _Example : https://api.demo.xsl-labs.io/api/v1/auth/vp_
> _/api/v1/auth/vp_ is required.
> - **CORS** : Front-end URL from which calls are made.
> _Example : https://demo.xsl-labs.io_
> - **ADMINS_DID** : List of all admins DID.
> _Example : 0x...,0x...,0x..._
> - **WEB3_GIVEN_PROVIDER** : Provider used by Web3.
> - **SMART_CONTRACT_ADDRESS** : Address of contract used during authentication.
> - **JWT_SECRET** : Secret for JWT encrypt/decrypt.
> For more information : https://github.com/dwyl/learn-json-web-tokens#how-to-generate-secret-key
> - **JWT_EXPIRES_IN** : JWT duration before expired.
> - **JWT_COOKIE_EXPIRES_IN** : JWT cookie duration before expired.

<br/><br/>
**Run Node.js application**

In development mode :
```shell
npm run dev
```
In production mode (using pm2) :
```shell
pm2 start server.js --name "demo-back" -o ./demo-back-out.log -e ./demo-back-err.log
```