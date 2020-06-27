import { Request, Response, NextFunction } from 'express'

import { admin, db } from '../services/admin'

export const FBAuth = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { authorization } = request.headers
  if (!authorization || !authorization.startsWith('Bearer'))
    return response.status(403).json({ message: 'Unauthorized' })

  const token = authorization.split('Bearer ')[1]

  try {
    const decodedToken = await admin.auth().verifyIdToken(token)
    request.user = decodedToken

    const data = await db
      .collection('users')
      .where('userId', '==', request.user.uid)
      .limit(1)
      .get()

    request.user.handle = data.docs[0].data().handle
    return next()
  } catch (err) {
    console.error(err)
    return response.status(403).json(err)
  }
}
