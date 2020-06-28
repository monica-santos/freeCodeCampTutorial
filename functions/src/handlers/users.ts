import { Response, Request } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import * as BusBoy from 'busboy'

import { firebaseConfig } from '../config/firebase'
import { db, admin } from '../services/admin'
import { reduceUserDetails } from '../validations/user'

const getUserDetails = async (request: Request, response: Response) => {
  try {
    const { handle } = request.params
    const user = await db.doc(`users/${handle}`).get()
    if (!user.exists)
      return response.status(404).json({ error: 'User not found' })

    const screamsDocs = await db
      .collection('screams')
      .orderBy('createdAt', 'desc')
      .where('userHandle', '==', handle)
      .get()

    const screams = screamsDocs.docs.map((scream) => ({
      screamId: scream.id,
      ...scream.data()
    }))

    return response.json({ user: user.data(), screams })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}

const markNotificationRead = async (request: Request, response: Response) => {
  const batch = db.batch()
  try {
    const { notifications } = request.body

    notifications.forEach((notificationId: string) => {
      const notification = db.doc(`notifications/${notificationId}`)
      batch.update(notification, { read: true })
    })
    
    await batch.commit()
    return response.json({ message: 'Notifications marked read' })
  } catch (err) {
    console.error(err)

    return response.status(500).json({ error: err.code })
  }
}

const getAuthenticatedUser = async (request: Request, response: Response) => {
  try {
    const doc = await db.doc(`users/${request.user.handle}`).get()
    if (!doc.exists)
      return response.status(500).json({ error: "Could't get the user" })

    const credentials = doc.data()

    const [likesDocs, notificationsDocs] = await Promise.all([
      db
        .collection('likes')
        .where('userHandle', '==', request.user.handle)
        .get(),
      db
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .where('recipient', '==', request.user.handle)
        .limit(10)
        .get()
    ])

    const likes = likesDocs.docs.map((like) => like.data())
    const notifications = notificationsDocs.docs.map((notification) => ({
      ...notification.data(),
      notificationId: doc.id
    }))

    return response.json({ credentials, likes, notifications })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}

const addUserDetails = async (request: Request, response: Response) => {
  try {
    const userDetails = reduceUserDetails(request.body)
    await db.doc(`users/${request.user.handle}`).update(userDetails)
    return response.json({ message: 'Details updated successfully' })
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}

const uploadImage = async (request: Request, response: Response) => {
  try {
    const busboy = new BusBoy({ headers: request.headers })
    const imageToBeUploaded = {
      filePath: '',
      mimetype: '',
      imageFileName: ''
    }
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        return response.status(400).json({ error: 'Wrong file type submitted' })
      }

      const imageExtension = filename.split('.').pop()
      const imageFileName = `${+new Date()}.${imageExtension}`
      const filePath = path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'tmp',
        imageFileName
      )

      file.pipe(fs.createWriteStream(filePath))
      imageToBeUploaded.filePath = filePath
      imageToBeUploaded.mimetype = mimetype
      imageToBeUploaded.imageFileName = imageFileName
    })

    busboy.on('finish', async () => {
      const { filePath, mimetype, imageFileName } = imageToBeUploaded
      if (!filePath)
        return response.status(400).json({ error: 'File not found' })

      await admin
        .storage()
        .bucket(firebaseConfig.storageBucket)
        .upload(filePath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: mimetype
            }
          }
        })

      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`

      await db.doc(`users/${request.user.handle}`).update({ imageUrl })
      return response.json({ message: 'Image uploaded successfully' })
    })

    busboy.end()
  } catch (err) {
    console.error(err)
    return response.status(500).json({ error: err.code })
  }
}

export {
  getAuthenticatedUser,
  addUserDetails,
  uploadImage,
  getUserDetails,
  markNotificationRead
}
