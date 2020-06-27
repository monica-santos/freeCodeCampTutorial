import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'

admin.initializeApp()

const app = express()

app.get('/screams', (request, response) => {
  admin
    .firestore()
    .collection('screams')
    .get()
    .then((data) => {
      const screams = data.docs.map((doc) => ({
        screamId: doc.id,
        ...doc.data()
      }))
      return response.json(screams)
    })
    .catch((err) => console.error(err))
})

app.post('/screams', (request, response) => {
  const { body, userHandle } = request.body

  return admin
    .firestore()
    .collection('screams')
    .add({
      body,
      userHandle,
      createdAt: admin.firestore.Timestamp.fromDate(new Date())
    })

    .then((doc) =>
      response.json({
        message: `document ${doc.id} created successfully.`
      })
    )
    .catch((err) => {
      console.error(err)
      return response.status(500).json({ err: 'something went wrong' })
    })
})

export const api = functions.https.onRequest(app)
