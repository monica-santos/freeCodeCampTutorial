import { Response, Request } from 'express'

import { db } from '../services/admin'

const createScream = async (request: Request, response: Response) => {
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
}

const getAllScreams = async (_: Request, response: Response) => {
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
}

const getScream = async (request: Request, response: Response) => {
  try {
    const { screamId } = request.params
    
    const doc = await db.doc(`screams/${screamId}`).get()

    if (!doc.exists)
      return response.status(404).json({ error: 'Scream not find' })

    const data = await db
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .where('screamId', '==', screamId)
      .get()

    const comments = data.docs.map((comment) => comment.data())

    return response.json({ screamId: doc.id, ...doc.data(), comments })
  } catch (err) {
    console.error(err)
    return response.json([])
  }
}

export { createScream, getAllScreams, getScream }
