import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'
import * as express from 'express'
import { firebaseConfig } from './config/firebase'

firebase.initializeApp(firebaseConfig)
admin.initializeApp()

const db = admin.firestore()
const app = express()

app.get('/screams', async (_, response) => {
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

app.post('/screams', async (request, response) => {
  const { body, userHandle } = request.body
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
  console.log('::: confirmPassword', confirmPassword)
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

export const api = functions.https.onRequest(app)
