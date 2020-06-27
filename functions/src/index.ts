import * as functions from 'firebase-functions'
import * as express from 'express'

import { signup, login } from './handlers/auth'
import { getAllScreams, createScream } from './handlers/screams'
import { FBAuth } from './middlewares/firebaseAuth'

const app = express()

app.post('/signup', signup)
app.post('/login', login)

app.get('/screams', FBAuth, getAllScreams)
app.post('/screams', FBAuth, createScream)

export const api = functions.https.onRequest(app)
