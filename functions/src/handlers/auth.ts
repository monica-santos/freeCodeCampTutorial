import { Response, Request } from 'express'
import * as firebase from 'firebase'

import { firebaseConfig } from '../config/firebase'
import { db } from '../services/admin'
import { validateSignUpData, validateLoginData } from '../validations/auth'

firebase.initializeApp(firebaseConfig)

const signup = async (request: Request, response: Response) => {
  const { email, password, confirmPassword, handle } = request.body

  const { valid, errors } = validateSignUpData({
    email,
    password,
    confirmPassword
  })

  if (!valid) return response.status(400).json({ errors })

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
}

const login = async (request: Request, response: Response) => {
  const { email, password } = request.body

  const { valid, errors } = validateLoginData({
    email,
    password
  })

  if (!valid) return response.status(400).json({ errors })

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
}

export { signup, login }
