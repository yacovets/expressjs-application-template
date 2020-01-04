import { Op } from 'sequelize'

import * as models from '../../models'
import { names } from '../../constants'
import * as servises from '../../servises'

export async function get(req, res, next) {

    try {

        let page = Number(req.query.page)
        let user = Number(req.query.user)
        
		const limit = 100

		if (!page || page <= 0) {

			page = 1
		}

		let where = {}

        if (user) {

            where.user_id = {
                [Op.eq]: user
            }
        }
        
        const data = await models.notifications.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.users,
                as: 'userNotifications',
                attributes: ['id', 'login']
            },{
                model: models.users,
                as: 'adminNotifications',
                attributes: ['id', 'login']
            }],
            offset: limit * (page - 1),
        })

        let notifications = data.rows

        notifications = servises.func.formatDateDb({
            data: notifications,
            type: 'copy'
        })

        for (const notif of notifications) {

            if (notif.notificationsParental) {

                notif.name = notif.notificationsParental.name
                notif.text = notif.notificationsParental.text
                delete notif.notificationsParental
            }

            notif.typeName = names.typeNotifications[notif.type] ? names.typeNotifications[notif.type].name : `role:${notif.type}`
            notif.statusName = names.statusNotifications[notif.status] ? names.statusNotifications[notif.status].name : `status:${notif.status}`
        }

        return res.render('admins/notifications', {
            title: 'История уведомлений',
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

export async function massNotifications(req, res, next) {

    try {

        let page = Number(req.query.page)
        let user = Number(req.query.user)
        
		const limit = 100

		if (!page || page <= 0) {

			page = 1
		}

		let where = {
            type: {
                [Op.eq]: 3
            }
        }

        if (user) {

            where.user_id = {
                [Op.eq]: user
            }
        }
        
        const data = await models.notifications.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.users,
                as: 'adminNotifications',
                attributes: ['id', 'login']
            },{
                model: models.notifications,
                as: 'notificationsParentalList',
            }],
            offset: limit * (page - 1),
        })

        let notifications = data.rows

        notifications = servises.func.formatDateDb({
            data: notifications,
            type: 'copy'
        })

        for (const notif of notifications) {


        }

        return res.render('admins/mass_notifications', {
            title: 'Массовая рассылка уведомлений',
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