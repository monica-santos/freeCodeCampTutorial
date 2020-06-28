import * as admin from 'firebase-admin'
import { firebaseConfig } from '../config/firebase'
const serviceAccount = require('../../serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL
})

const db = admin.firestore()

export { admin, db }
