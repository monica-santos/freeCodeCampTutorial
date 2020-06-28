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
    console.error(err)
    return response.status(500).json({ error: err.code })
  }

  try {
    const { user } = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)

    const profilePicture = 'blank-profile-picture.png'

    const token = await user?.getIdToken()
    const userCredentials = {
      handle,
      email,
      createdAt: new Date().toISOString(),
      userId: user?.uid,
      imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${profilePicture}?alt=media`
    }

    await db.doc(`users/${handle}`).set(userCredentials)

    return response.status(201).json({ token })
  } catch (err) {
    console.error(err)
    if (err.code === 'auth/email-already-in-use')
      return response.status(400).json({ email: 'Email is already in use' })
    return response
      .status(500)
      .json({ general: 'Something went wrong, please try again' })
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
    return response
      .status(403)
      .json({ general: 'Wrong credential, please try again' })
  }
}

export { signup, login }
