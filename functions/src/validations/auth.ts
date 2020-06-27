import { isEmptyString, isEmail } from './utils'

interface validateSignUpDataParams {
  email: string
  password: string
  confirmPassword: string
}

interface validateLoginDataParams {
  email: string
  password: string
}

interface AuthErrors {
  email?: string
  password?: string
}

interface authValidationResponse {
  errors: AuthErrors
  valid: boolean
}

const validateSignUpData = ({
  email,
  password,
  confirmPassword
}: validateSignUpDataParams): authValidationResponse => {
  const errors: AuthErrors = {}

  if (isEmptyString(email)) errors.email = 'Must not be empty'
  else if (!isEmail(email)) errors.email = 'Must be a valid email address'

  if (isEmptyString(password)) errors.password = 'Must not be empty'
  else if (password !== confirmPassword)
    errors.password = 'Passwords must match'

  return {
    errors,
    valid: !Boolean(Object.keys(errors).length)
  }
}

const validateLoginData = ({ email, password }: validateLoginDataParams): authValidationResponse => {
  const errors: AuthErrors = {}

  if (isEmptyString(email)) errors.email = 'Must not be empty'
  if (isEmptyString(password)) errors.password = 'Must not be empty'

  return {
    errors,
    valid: !Boolean(Object.keys(errors).length)
  }
}

export { validateSignUpData, validateLoginData }
