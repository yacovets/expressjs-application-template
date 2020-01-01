import express from 'express'
import { admins } from '../controllers'

export default app => {

    const adminRouter = express.Router()

    app.use(`/admin`, adminRouter)

    adminRouter.get('/', admins.main.home)
}