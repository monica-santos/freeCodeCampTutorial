import { Response, Request } from 'express'

import { db } from '../services/admin'

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

export {
  getAllScreams, createScream
}