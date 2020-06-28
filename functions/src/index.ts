import * as functions from 'firebase-functions'
import * as express from 'express'

import { signup, login } from './handlers/auth'
import {
  createScream,
  getAllScreams,
  getScream,
  addCommentOnScream,
  addLikeToScream,
  removeLikeFromScream
} from './handlers/screams'
import {
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} from './handlers/users'
import { FBAuth } from './middlewares/firebaseAuth'

const app = express()

app.post('/signup', signup)
app.post('/login', login)

app.patch('/user/image', FBAuth, uploadImage)
app.patch('/user/', FBAuth, addUserDetails)
app.get('/user/', FBAuth, getAuthenticatedUser)

app.post('/screams', FBAuth, createScream)
app.get('/screams', FBAuth, getAllScreams)
app.get('/scream/:screamId', FBAuth, getScream)
app.post('/scream/:screamId/comment', FBAuth, addCommentOnScream)
app.post('/scream/:screamId/like', FBAuth, addLikeToScream)
app.post('/scream/:screamId/unlike', FBAuth, removeLikeFromScream)

export const api = functions.https.onRequest(app)
