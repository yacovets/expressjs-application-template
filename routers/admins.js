import express from 'express'

import { admins } from '../controllers'
import { cash } from '../servises'
import { userBruteforce, globalBruteforce } from '../include/bruteforce'

export default app => {

    const adminRouter = express.Router()

    app.use(`/admin`, cash.accessUsers([2]), adminRouter)

    adminRouter.get('/', admins.main.home)
}