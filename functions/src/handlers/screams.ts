import { Response, Request } from 'express'

import { db } from '../services/admin'

const createScream = async (request: Request, response: Response) => {
  const { body } = request.body
  const { handle: userHandle, imageUrl: userImage } = request.user

  try {
    const scream = {
      body,
      userHandle,
      userImage,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0
    }
    const { id: screamId } = await db.collection('screams').add(scream)

    return response.json({ screamId, ...scream })
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
      return response.status(404).json({ error: 'Scream not found' })

    const data = await db
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .where('screamId', '==', screamId)
      .get()

    const comments = data.docs.map((comment) => comment.data())

    return response.json({ screamId: doc.id, ...doc.data(), comments })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}

const addCommentOnScream = async (request: Request, response: Response) => {
  try {
    const { body } = request.body
    const { screamId } = request.params
    const { handle: userHandle, imageUrl: userImage } = request.user

    if (body.trim() === '')
      return response.status(500).json({ error: 'Must not be empty' })

    const doc = await db.doc(`screams/${screamId}`).get()
    if (!doc.exists)
      return response.status(404).json({ error: 'Scream not found' })

    const comment = {
      body,
      createdAt: new Date().toISOString(),
      screamId,
      userHandle,
      userImage
    }

    await doc.ref.update({ commentCount: doc.data()?.commentCount + 1})
    await db.collection('comments').add(comment)

    return response.json({ comment })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}
const addLikeToScream = async (request: Request, response: Response) => {
  try {
    const { handle: userHandle } = request.user
    const { screamId } = request.params

    const doc = await db.doc(`/screams/${screamId}`).get()

    if (!doc.exists)
      return response.status(404).json({ error: 'Scream not found' })

    const data = await db
      .collection('likes')
      .orderBy('createdAt', 'desc')
      .where('userHandle', '==', userHandle)
      .where('screamId', '==', screamId)
      .limit(1)
      .get()

    if (!data.empty)
      return response.status(500).json({ error: 'Scream already liked' })

    await db.collection('likes').add({
      screamId,
      userHandle
    })

    const screamData = { ...doc.data() }
    ;(screamData.screamId = doc.id), screamData.likeCount++

    await db
      .doc(`/screams/${screamId}`)
      .update({ likeCount: screamData.likeCount })

    return response.json(screamData)
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}
const removeLikeFromScream = async (request: Request, response: Response) => {
  try {
    const { handle: userHandle } = request.user
    const { screamId } = request.params

    const doc = await db.doc(`/screams/${screamId}`).get()

    if (!doc.exists)
      return response.status(404).json({ error: 'Scream not found' })

    const data = await db
      .collection('likes')
      .where('userHandle', '==', userHandle)
      .where('screamId', '==', screamId)
      .limit(1)
      .get()

    if (data.empty)
      return response.status(500).json({ error: 'Scream not liked' })

    const likeId = data.docs[0].id

    await db.doc(`likes/${likeId}`).delete()

    const screamData = { ...doc.data() }
    ;(screamData.screamId = doc.id), screamData.likeCount--

    await db
      .doc(`/screams/${screamId}`)
      .update({ likeCount: screamData.likeCount })

    return response.json(screamData)
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}

export {
  createScream,
  getAllScreams,
  getScream,
  addCommentOnScream,
  addLikeToScream,
  removeLikeFromScream
}
