<h1 align=center>Social Media Application</h1>

This project was created following the **Full Stack React & Firebase Tutorial Series** playlist on [Classed Youtube Channel][youtube]

# Technologies

The main technologies used were:

- [Node.js v10][node]
- [Google Firebase][firebase]
- [React][react]

# Firebase Functions Credentials

First, go to the `/functions` directory.

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
var admin = require('firebase-admin')

var serviceAccount = require('path/to/serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    'https://your-database-url-that-is-given-under-admin-sdk-snippets'
})
```

[youtube]: https://www.youtube.com/watch?v=RkBfu-W7tt0&list=PLMhAeHCz8S38ryyeMiBPPUnFAiWnoPvWP
[firebase]: https://firebase.google.com/
[react]: https://reactjs.org/docs/getting-started.html
[node]: https://nodejs.org/dist/v10.21.0/docs/api/
