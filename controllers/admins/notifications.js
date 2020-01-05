import { Op } from 'sequelize'

import * as models from '../../models'
import { names } from '../../constants'
import * as servises from '../../servises'
import sequelize from '../../include/db'

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
        } else {

            where.user_id = {
                [Op.ne]: null
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
            }, {
                model: models.users,
                as: 'adminNotifications',
                attributes: ['id', 'login']
            }, {
                model: models.notifications,
                as: 'notificationsParental',
                attributes: ['name', 'text']
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

            notif.typeName = names.typeNotifications[notif.type] ? names.typeNotifications[notif.type].name : `type:${notif.type}`
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

        const limit = 100

        if (!page || page <= 0) {

            page = 1
        }

        let where = {
            type: {
                [Op.eq]: 3
            }
        }

        where.user_id = {
            [Op.eq]: null
        }

        const data = await models.notifications.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.users,
                as: 'adminNotifications',
                attributes: ['id', 'login']
            }, {
                model: models.notifications,
                as: 'notificationsParentalList',
                attributes: ['id', 'status']
            }],
            offset: limit * (page - 1),
        })

        let notifications = data.rows

        notifications = servises.func.formatDateDb({
            data: notifications,
            type: 'copy'
        })

        for (const notif of notifications) {

            notif.countSend = 0
            notif.countRead = 0

            for (const parental of notif.notificationsParentalList) {

                notif.countSend++

                if (parental.status === 1) {
                    notif.countRead++
                }
            }
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

export async function massNotificationsHandler(req, res, next) {

    try {


        const name = String(req.body.name).trim()
        const text = String(req.body.text).trim()

        if (!name || name === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите название.`)
            return res.redirect(req.originalUrl)
        }
        if (!text || text === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите текст.`)
            return res.redirect(req.originalUrl)
        }

        const users = await models.users.findAll({
            where: {
                status: {
                    [Op.ne]: 0
                }
            },
            attributes: ['id']
        })

        let transaction

        try {

            transaction = await sequelize.transaction()

            const resCreateMainNotification = await models.notifications.create({
                user_id: null,
                admin_id: req.user.id,
                type: 3,
                level: null,
                status: null,
                name: name,
                text: text,
            }, {
                transaction
            })

            let bulkCreate = []
            let usersId = []

            for (const user of users) {

                bulkCreate.push({
                    user_id: user.id,
                    parental_id: resCreateMainNotification.id,
                    status: 2,
                    type: 3,
                    name: null,
                    text: null,
                })

                usersId.push(user.id)
            }

            const resCreateOtherNotifications = await models.notifications.bulkCreate(bulkCreate, {
                transaction
            })

            await transaction.commit()
        } catch (errorTransaction) {

            console.error('Error transaction notifications')
            console.error(errorTransaction)

            if (transaction) {
                await transaction.rollback()
            }

            req.flash('type', 'warn')
            req.flash('message', `При создании транзакции произошла ошибка.`)
            return res.redirect(req.originalUrl)
        }

        req.flash('type', 'info')
        req.flash('message', `Рассылка успешно создана.`)
        return res.redirect(req.originalUrl)
    } catch (error) {
        return next(error)
    }
}