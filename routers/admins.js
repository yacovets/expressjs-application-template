import express from 'express'

import { admins } from '../controllers'
import { cash } from '../servises'

export default app => {

    const adminRouter = express.Router()

    app.use(`/admin`, cash.accessUsers([2]), adminRouter)

    adminRouter.get('/users', admins.users.get)
    adminRouter.get('/users/:id', admins.users.getOne)
    adminRouter.get('/users/:id/edit', admins.users.edit)
    adminRouter.post('/users/:id/edit', admins.users.editHandler)
    adminRouter.post('/users/:id/block', admins.users.block)
    adminRouter.post('/users/:id/notifications', admins.users.sendNotifications)

    adminRouter.get('/authorizations', admins.authorizations.get)

    adminRouter.get('/systems', admins.systems.get)
    adminRouter.post('/systems/technical-work', admins.systems.technicalWork)
    adminRouter.post('/systems/message', admins.systems.message)

    adminRouter.get('/notifications', admins.notifications.get)

    adminRouter.get('/mass-notifications', admins.notifications.massNotifications)
    adminRouter.post('/mass-notifications', admins.notifications.massNotificationsHandler)
}