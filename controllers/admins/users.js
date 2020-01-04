import { Op } from 'sequelize'
import validator from 'validator'

import * as models from '../../models'
import { names } from '../../constants'
import * as servises from '../../servises'
import { emails } from '../../templates'

export async function get(req, res, next) {

    try {

        let page = Number(req.query.page)
        let search = String(req.query.search).trim()
        let ref = Number(req.query.ref)

        const limit = 100

        if (!page || page <= 0) {

            page = 1
        }

        let where = {}

        if (search && search != 'undefined') {

            where.login = {
                [Op.like]: `%${search}%`
            }
        }
        if (ref) {

            where.ref = {
                [Op.eq]: ref
            }
        }

        const data = await models.users.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.users,
                as: 'userRef',
                attributes: ['id', 'login']
            }],
            offset: limit * (page - 1),
        })

        let users = data.rows

        users = servises.func.formatDateDb({
            data: users,
            type: 'copy'
        })

        for (const user of users) {

            user.roleName = names.roleUser[user.role] ? names.roleUser[user.role].name : `role:${user.role}`
            user.statusName = names.statusUser[user.status] ? names.statusUser[user.status].name : `status:${user.status}`
        }

        return res.render('admins/users', {
            title: 'Список пользователей',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: users,
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

export async function getOne(req, res, next) {

    try {

        const id = Number(req.params.id)

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            include: [{
                model: models.users,
                as: 'userRef',
                attributes: ['id', 'login']
            }],
        })

        if (!data) {
            return next(Error('notFound'))
        }

        data = servises.func.formatDateDb({
            data: [data],
            type: 'copy'
        })[0]

        data.roleName = names.roleUser[data.role] ? names.roleUser[data.role].name : `role:${data.role}`
        data.statusName = names.statusUser[data.status] ? names.statusUser[data.status].name : `status:${data.role}`

        return res.render('admins/user', {
            title: 'Информация о пользователе',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: data
        })
    } catch (error) {
        return next(error)
    }
}

export async function edit(req, res, next) {

    try {

        const id = Number(req.params.id)

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            include: [{
                model: models.users,
                as: 'userRef',
                attributes: ['id', 'login']
            }],
        })

        if (!data) {
            return next(Error('notFound'))
        }

        data = servises.func.formatDateDb({
            data: [data],
            type: 'copy'
        })[0]

        return res.render('admins/edit_user', {
            title: 'Редактирование профиля пользователя',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: {
                user: data,
                roles: names.roleUser
            }
        })
    } catch (error) {
        return next(error)
    }
}

export async function editHandler(req, res, next) {

    try {

        const id = Number(req.params.id)

        const email = String(req.body.email).trim().toLowerCase()
        const verifEmail = Number(req.body.verifEmail)
        const emailStatus = Number(req.body.emailStatus)
        const role = Number(req.body.role)

        // Valid email
        if (!email || email === 'undefined' || !validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите email.`)
            return res.redirect(req.originalUrl)
        }
        if (!validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите корректный email.`)
            return res.redirect(req.originalUrl)
        }
        // Valid status email
        if ([1, 2].indexOf(emailStatus) === -1) {
            req.flash('type', 'warn')
            req.flash('message', `Выберите статус верификации почты.`)
            return res.redirect(req.originalUrl)
        }
        // Valid role
        if (!names.roleUser[role]) {
            req.flash('type', 'warn')
            req.flash('message', `Выберите верную роль.`)
            return res.redirect(req.originalUrl)
        }

        const resUpdate = await models.users.update({
            email: email,
            status_email: emailStatus,
            role: role
        }, {
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            returning: true
        })

        if (verifEmail === 1) {

            const createTokens = await models.emailTokens.create({
                user_id: resUpdate[1][0].id,
                expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                type: 1,
                status: 1,
                data: {
                    email: email
                }
            })

            servises.email.send({
                email: email,
                subject: 'Подтверждение почты',
                body: emails.confirmEmail({
                    login: resUpdate[1][0].login,
                    token: createTokens.token
                })
            })
        }

        req.flash('type', 'info')
        req.flash('message', `Профиль пользователя отредактирован.`)
        return res.redirect(req.originalUrl)
    } catch (error) {
        return next(error)
    }
}

export async function block(req, res, next) {

    try {

        const id = Number(req.params.id)

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            attributes: ['id', 'status']
        })

        if (!data) {
            return next(Error('notFound'))
        }

        let status = 1

        if (data.status === 1) {
            status = 0
        }

        await models.users.update({
            status: status
        }, {
            where: {
                id: {
                    [Op.eq]: id
                }
            }
        })

        req.flash('type', 'info')
        req.flash('message', `Статус изменен.`)
        return res.redirect(`/admin/users/${id}`)
    } catch (error) {
        return next(error)
    }
}

export async function sendNotifications(req, res, next) {

    try {

        const id = Number(req.params.id)

        const name = String(req.body.name).trim()
        const text = String(req.body.text).trim()

        if (!name || name === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите название.`)
            return res.redirect(`/admin/users/${id}`)
        }
        if (!text || text === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите текст.`)
            return res.redirect(`/admin/users/${id}`)
        }

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            }
        })

        if (!data) {
            return next(Error('notFound'))
        }

        await models.notifications.create({
            user_id: id,
            admin_id: req.user.id,
            type: 2,
            level: 1,
            status: 2,
            name: name,
            text: text,
        })

        req.flash('type', 'info')
        req.flash('message', `Уведомление успешно отправленно`)
        return res.redirect(`/admin/users/${id}`)
    } catch (error) {
        return next(error)
    }
}