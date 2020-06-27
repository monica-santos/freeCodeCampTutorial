# Credentials

To use `firebase serve`, you need to set your credentials, there are some ways to do this.

declare on your **.env** file:
```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
```

export it:

```sh
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
```

or add to the source code:

```js
var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-database-url-that-is-given-under-admin-sdk-snippets"
});
```