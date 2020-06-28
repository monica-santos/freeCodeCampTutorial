import * as functions from 'firebase-functions'
import * as express from 'express'

import { signup, login } from './handlers/auth'
import {
  createScream,
  getAllScreams,
  getScream,
  deleteScream,
  addCommentOnScream,
  addLikeToScream,
  removeLikeFromScream
} from './handlers/screams'
import {
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationRead
} from './handlers/users'
import { FBAuth } from './middlewares/firebaseAuth'
import { db } from './services/admin'

const app = express()

app.post('/signup', signup)
app.post('/login', login)

app.patch('/user/image', FBAuth, uploadImage)
app.patch('/user/', FBAuth, addUserDetails)
app.get('/user/', FBAuth, getAuthenticatedUser)
app.post('/user/notifications', FBAuth, markNotificationRead)

app.get('/user/:handle', getUserDetails)

app.post('/screams', FBAuth, createScream)
app.delete('/scream/:screamId', FBAuth, deleteScream)
app.post('/scream/:screamId/comment', FBAuth, addCommentOnScream)
app.post('/scream/:screamId/like', FBAuth, addLikeToScream)
app.post('/scream/:screamId/unlike', FBAuth, removeLikeFromScream)

app.get('/screams', getAllScreams)
app.get('/scream/:screamId', getScream)

export const api = functions.https.onRequest(app)

export const createNotificationsOnLike = functions.firestore
  .document('likes/{id}')
  .onCreate(async (snapshot) => {
    try {
      const doc = await db.doc(`/screams/${snapshot.data().screamId}`).get()
      if (doc.exists && doc.data()?.userHandle !== snapshot.data().userHandle)
        await db.doc(`notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data()?.userHandle,
          sender: snapshot.data()?.userHandle,
          type: 'like',
          read: false,
          screamId: doc.id
        })
    } catch (err) {
      console.error(err)
    }
    return
  })

export const deleteNotificationsOnUnlike = functions.firestore
  .document('likes/{id}')
  .onDelete(async (snapshot) => {
    try {
      await db.doc(`/notifications/${snapshot.id}`).delete()
    } catch (err) {
      console.error(err)
    }
    return
  })

export const createNotificationsOnComment = functions.firestore
  .document('comments/{id}')
  .onCreate(async (snapshot) => {
    try {
      const doc = await db.doc(`/screams/${snapshot.data().screamId}`).get()

      if (doc.exists && doc.data()?.userHandle !== snapshot.data().userHandle)
        await db.doc(`notifications/${snapshot.id}`).set({
          createdAt: new Date().toISOString(),
          recipient: doc.data()?.userHandle,
          sender: snapshot.data()?.userHandle,
          type: 'comment',
          read: false,
          screamId: doc.id
        })
    } catch (err) {
      console.error(err)
    }
    return
  })
