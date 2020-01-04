import { Op } from 'sequelize'

import * as models from '../../models'
import * as servises from '../../servises'

export async function get(req, res, next) {

    try {

        let page = Number(req.query.page)

        const limit = 100

        if (!page || page <= 0) {

            page = 1
        }

        const data = await models.notifications.findAndCountAll({
            where: {
                user_id: {
                    [Op.eq]: req.user.id
                }
            },
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.notifications,
                as: 'notificationsParental'
            }],
            offset: limit * (page - 1),
        })

        let notifications = data.rows

        notifications = servises.func.formatDateDb({
            data: notifications,
            type: 'copy'
        })

        let update = false

        for (const notif of notifications) {

            if (notif.notificationsParental) {

                notif.name = notif.notificationsParental.name
                notif.text = notif.notificationsParental.text
                delete notif.notificationsParental
            }

            if (notif.status === 2) {

                update = true
            }
        }

        // if (update) {

        //     await models.notifications.update({
        //         status: 1
        //     }, {
        //         where: {
        //             user_id: {
        //                 [Op.eq]: req.user.id
        //             },
        //             status: {
        //                 [Op.eq]: 2
        //             }
        //         }
        //     })

        //     // servises.cash.notificationDelAll(req.user.id)
        // }

        return res.render('users/notifications', {
            title: 'Центр уведомлений',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: notifications,
            pagination: {
                count: data.count,
                pages: Math.ceil(data.count / limit),
                page: page,
            }
        })
    } catch (error) {
        return next(error)
    }
}