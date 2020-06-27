import {  isEmptyString } from './utils'

interface UserDetails {
  bio?: string
  website?: string
  location?: string
}

const reduceUserDetails = ({ bio, website, location }: UserDetails): UserDetails => {
  const userDetails: UserDetails = {}
  if (bio && !isEmptyString(bio)) userDetails.bio = bio
  if (website && !isEmptyString(website)) userDetails.website = website
  if (location && !isEmptyString(location)) userDetails.location = location
  return userDetails
}

export { reduceUserDetails }
