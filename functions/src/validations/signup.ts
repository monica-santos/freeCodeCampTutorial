const isEmail = (email: string): boolean => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return Boolean(email.match(regEx))
}

const isEmptyString = (value: string): boolean => {
  return value.trim() === ''
}

export { isEmail, isEmptyString }
