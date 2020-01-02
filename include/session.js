import session from 'cookie-session'

export default session({
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    path: '/',
    httpOnly: true,
    secure: false,
    signed: true,
    maxAge: Number(process.env.SESSION_EXPIRE)
})