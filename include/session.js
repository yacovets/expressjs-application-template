import redis from 'redis'
import connectRedis from 'connect-redis'
import session from 'express-session'

const client = redis.createClient({
    prefix: 'session',
    family: 'IPv6'
})

const RedisStore = connectRedis(session)

export default session({
    store: new RedisStore({ client }),
    name: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true,
        maxAge: Number(process.env.SESSION_EXPIRE)
    }
})