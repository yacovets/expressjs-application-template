import rateLimit from 'express-rate-limit'
import redisStore from 'rate-limit-redis'

const limiterMain = new rateLimit({
    store: new redisStore({
        prefix: 'limiter'
    }),
    windowMs: process.env.LIMITER_EXPIRED,
    max: process.env.LIMITER_MAX_REQ,
    handler: (req, res, next) => {

        next(Error('limiter'))
    }
})

export default limiterMain