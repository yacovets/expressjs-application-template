import validator from 'validator'
import { Op } from 'sequelize'
import bcrypt from 'bcrypt'

import * as models from '../../models'
import { emails } from '../../templates'
import { bannedLoginPassword } from '../../constants'
import * as servises from '../../servises'

const urlApp = process.env.APP_URL

export async function get(req, res, next) {

    try {

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: req.user.id
                }
            }
        })

        data.dataValues.refLink = `${urlApp}/register?ref=${data.hashId()}`

        data = servises.func.formatDateDb({
            data: [data.dataValues],
            type: 'copy'
        })[0]

        return res.render('users/profile', {
            title: 'Домашняя страница',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data
        })
    } catch (error) {
        return next(error)
    }
}

export async function edit(req, res, next) {

    try {

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: req.user.id
                }
            }
        })

        data = servises.func.formatDateDb({
            data: [data.dataValues],
            type: 'copy'
        })[0]

        return res.render('users/edit', {
            title: 'Редактирование профиля',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data
        })
    } catch (error) {
        return next(error)
    }
}

export async function editHandler(req, res, next) {

    try {

        const email = String(req.body.email).trim().toLowerCase()
        const oldPassword = String(req.body.oldPassword)
        const newPassword = String(req.body.newPassword)
        const confirmNewPassword = String(req.body.confirmNewPassword)

        // Valid email
        if (!email || email === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите email.`)
            return res.redirect(req.originalUrl)
        }
        if (!validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите корректный email.`)
            return res.redirect(req.originalUrl)
        }

        if (oldPassword && oldPassword != 'undefined') {

            // valid password
            if (!newPassword || newPassword === 'undefined') {
                req.flash('type', 'warn')
                req.flash('message', `Введите новый пароль`)
                return res.redirect(req.originalUrl)
            }
            if (!confirmNewPassword || confirmNewPassword === 'undefined') {
                req.flash('type', 'warn')
                req.flash('message', `Повторите новый пароль`)
                return res.redirect(req.originalUrl)
            }
            if (newPassword != confirmNewPassword) {
                req.flash('type', 'warn')
                req.flash('message', `Пароли не совпадают.`)
                return res.redirect(req.originalUrl)
            }
            if (newPassword.length < 7 || newPassword.length > 60) {

                req.flash('type', 'warn')
                req.flash('message', `Пароль должен быть не менее 7 символов и не более 60.`)
                return res.redirect(req.originalUrl)
            }
            if (newPassword.toLowerCase().indexOf(req.user.login.toLowerCase()) != -1) {

                req.flash('type', 'warn')
                req.flash('message', `Пожалуйста, не используйте в пароле свой логин, это может быть не безопасно!`)
                return res.redirect(req.originalUrl)
            }
            if (bannedLoginPassword.passwords.indexOf(newPassword.toLowerCase()) != -1) {

                req.flash('type', 'warn')
                req.flash('message', `Пожалуйста, не используйте стандартные пароли, это может быть не безопасно!`)
                return res.redirect(req.originalUrl)
            }
        }

        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: req.user.id
                }
            }
        })

        let update = {}
        let updateCash = {}

        if (oldPassword && oldPassword != 'undefined') {

            if (!data.validPassword(oldPassword)) {

                req.flash('type', 'warn')
                req.flash('message', `Не верные старый пароль.`)
                return res.redirect(req.originalUrl)
            }

            const saltRounds = 10
            const salt = bcrypt.genSaltSync(saltRounds)
            const hash = bcrypt.hashSync(newPassword, salt)

            update.password = hash
        }

        if (data.email != email) {

            const searchEmail = await models.users.findOne({
                where: {
                    email: {
                        [Op.eq]: email
                    }
                }
            })

            if (searchEmail) {

                req.flash('type', 'warn')
                req.flash('message', `Пользователь с таким email уже существует.`)
                return res.redirect(req.originalUrl)
            }

            
            updateCash.email = email
            updateCash.status_email = 2
            
            update.email = email
            update.status_email = 2
        }

        if (Object.keys(update).length <= 0) {

            req.flash('type', 'warn')
            req.flash('message', `Нет новых данных, для обновления профиля.`)
            return res.redirect(req.originalUrl)
        }

        await models.users.update(update, {
            where: {
                id: {
                    [Op.eq]: data.id
                }
            }
        })

        servises.cash.update(req.user.id, updateCash)

        if (update.status_email === 2) {

            const createTokens = await models.emailTokens.create({
                user_id: data.id,
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
                    login: data.login,
                    token: createTokens.token
                })
            })
        }

        req.flash('type', 'info')
        req.flash('message', `Данные успешно изменены`)
        return res.redirect(req.originalUrl)
    } catch (error) {
        return next(error)
    }
}