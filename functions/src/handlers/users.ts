import { Response, Request } from 'express'
import * as path from 'path'
import * as fs from 'fs'
import * as BusBoy from 'busboy'
import { firebaseConfig } from '../config/firebase'
import { db, admin } from '../services/admin'

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

export { uploadImage }
