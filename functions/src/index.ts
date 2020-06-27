import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'
import * as express from 'express'
import { firebaseConfig } from './config/firebase'
import { isEmptyString, isEmail } from './validations/signup'
import { AuthErrors } from './interfaces/AuthErrors'

export const FBAuth = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) => {
  const { authorization } = request.headers
  if (!authorization || !authorization.startsWith('Bearer'))
    return response.status(403).json({ message: 'Unauthorized' })

  const token = authorization.split('Bearer ')[1]

  try {
    const decodedToken = await admin.auth().verifyIdToken(token)
    request.user = decodedToken

    const data = await db
      .collection('users')
      .where('userId', '==', request.user.uid)
      .limit(1)
      .get()

    request.user.handle = data.docs[0].data().handle
    return next()
  } catch (err) {
    console.error(err)
    return response.status(403).json(err)
  }
}

firebase.initializeApp(firebaseConfig)
admin.initializeApp()

const db = admin.firestore()
const app = express()

app.get('/screams', FBAuth, async (_, response) => {
  try {
    const { docs } = await db
      .collection('screams')
      .orderBy('createdAt', 'desc')
      .get()

    const screams = docs.map((doc) => ({
      screamId: doc.id,
      ...doc.data()
    }))

    return response.json(screams)
  } catch (err) {
    console.error(err)
    return response.json([])
  }
})

app.post('/screams', FBAuth, async (request, response) => {
  const { body } = request.body
  const { handle: userHandle } = request.user

  try {
    const { id } = await db.collection('screams').add({
      body,
      userHandle,
      createdAt: new Date().toISOString()
    })

    return response.json({
      message: `document ${id} created successfully.`
    })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: 'something went wrong' })
  }
})

app.post('/signup', async (request, response) => {
  const { email, password, confirmPassword, handle } = request.body

  const errors: AuthErrors = {}

  if (isEmptyString(email)) errors.email = 'Must not be empty'
  else if (!isEmail(email)) errors.email = 'Must be a valid email address'

  if (isEmptyString(password)) errors.password = 'Must not be empty'
  else if (password !== confirmPassword)
    errors.password = 'Passwords must match'

  if (Object.keys(errors).length) return response.status(400).json({ errors })

  try {
    const doc = await db.doc(`users/${handle}`).get()
    if (doc.exists) {
      return response.status(400).json({
        handle: 'this handle is already taken'
      })
    }
  } catch (err) {
    console.error('::: firestore error', err)
    return response.status(500).json({ error: err.code })
  }

  try {
    const { user } = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)

    const token = await user?.getIdToken()
    const userCredentials = {
      handle,
      email,
      createdAt: new Date().toISOString(),
      userId: user?.uid
    }

    await db.doc(`users/${handle}`).set(userCredentials)

    return response.status(201).json({ token })
  } catch (err) {
    console.error(err)
    if (err.code === 'auth/email-already-in-use')
      return response.status(500).json({ error: err.code })
    return response.status(500).json({ error: err.code })
  }
})

app.post('/login', async (request, response) => {
  const { email, password } = request.body

  const errors: AuthErrors = {}

  if (isEmptyString(email)) errors.email = 'Must not be empty'
  if (isEmptyString(password)) errors.password = 'Must not be empty'

  if (Object.keys(errors).length) return response.status(400).json({ errors })

  try {
    const { user } = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password)

    const token = await user?.getIdToken()

    return response.json({ token })
  } catch (err) {
    if (err.code === 'auth/wrong-password')
      return response
        .status(403)
        .json({ general: 'Wrong credential, please try again' })

    return response.status(500).json({ error: err.code })
  }
})

export const api = functions.https.onRequest(app)
