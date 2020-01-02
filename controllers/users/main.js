import validator from 'validator'
import { Op } from 'sequelize'
import crypto from 'crypto'

import * as models from '../../models'
import { bannedLoginPassword, emails } from '../../templates'
import * as servises from '../../servises'

export async function home(req, res, next) {

    try {

        return res.render('users/home', {
            title: 'Домашняя страница',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
        })
    } catch (error) {
        console.error(error)
    }
}

export async function register(req, res, next) {

    try {

        if (req.session.user) {
            return res.redirect(`/`)
        }

        return res.render('users/register', {
            title: 'Регистрация',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
        })
    } catch (error) {
        return next(error)
    }
}

export async function registerHandler(req, res, next) {

    try {

        if (req.session.user) {
            req.flash('type', 'warn')
            req.flash('message', `У вас уже есть аккаунт.`)
            return res.redirect(`/`)
        }

        const login = String(req.body.login).trim()
        const email = String(req.body.email).trim().toLowerCase()
        const password = String(req.body.password)
        const passwordConfirm = String(req.body.password)
        const consent = Number(req.body.consent)

        // Valid login
        if (!login || login === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите логин.`)
            return res.redirect(req.url)
        }
        if (/^[a-zA-Z]+([-_]?[a-zA-Z0-9]+){0,2}$/.test(login) === false) {

            req.flash('type', 'warn')
            req.flash('message', `В логине должны быть только латинские буквы, цифры и знаки - _, но не более одного знака подряд. Логин должен начинатся с буквы, а оканчиватся буквой или цифрой!`)
            return res.redirect(req.url)
        }
        if (bannedLoginPassword.logins.indexOf(login.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Данный логин уже занят, попробуйте дургой.`)
            return res.redirect(req.url)
        }
        // Valid email
        if (!email || email === 'undefined' || !validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите email.`)
            return res.redirect(req.url)
        }
        if (!validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите корректный email.`)
            return res.redirect(req.url)
        }
        // valid password
        if (!password || password === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль.`)
            return res.redirect(req.url)
        }
        if (!passwordConfirm || passwordConfirm === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль повторно.`)
            return res.redirect(req.url)
        }
        if (password != passwordConfirm) {
            req.flash('type', 'warn')
            req.flash('message', `Пароли не совпадают.`)
            return res.redirect(req.url)
        }
        if (password.length < 7 || password.length > 60) {

            req.flash('type', 'warn')
            req.flash('message', `Пароль должен быть не менее 7 символов и не более 60.`)
            return res.redirect(req.url)
        }
        if (password.toLowerCase().indexOf(login.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Пожалуйста, не используйте в пароле свой логин, это может быть не безопасно!`)
            return res.redirect(req.url)
        }
        if (bannedLoginPassword.passwords.indexOf(password.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Пожалуйста, не используйте стандартные пароли, это может быть не безопасно!`)
            return res.redirect(req.url)
        }
        if (consent != 1) {
            req.flash('type', 'warn')
            req.flash('message', `Нельзя зарегистрировать аккаунт, не приняв политику конфидициальности и правил сервиса.`)
            return res.redirect(req.url)
        }

        let search = await models.users.findOne({
            where: {
                [Op.or]: [
                    {
                        login: {
                            [Op.like]: login
                        },
                        email: {
                            [Op.eq]: email
                        }
                    }
                ],
                deleted_at: {
                    [Op.eq]: null
                }
            }
        })

        if (search) {

            if (search.login.toLowerCase() === login.toLowerCase()) {

                req.flash('type', 'warn')
                req.flash('message', `Данный логин уже занят, попробуйте дургой.`)
                return res.redirect(req.url)
            }

            if (search.email === email) {

                req.flash('type', 'warn')
                req.flash('message', `Аккаунт с данным email уже создан, укажите другой email.`)
                return res.redirect(req.url)
            }
        }

        const newUser = await models.users.create({
            login: login,
            email: email,
            role: 1,
            status: 1,
            status_email: 2,
            password: password
        })

        const token = crypto.randomBytes(55).toString('hex')

        await models.emailTokens.create({
            user_id: newUser.id,
            token: token,
            expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            type: 1,
            status: 1,
            data: {
                email: newUser.email
            }
        })

        servises.email.send({
            email: email,
            subject: 'Подтверждение почты',
            body: emails.confirmEmail({
                login: newUser.login,
                token: token
            })
        })

        req.flash('type', 'info')
        req.flash('message', `Аккаунт успешно создан, подтвердите пожалуйста ваш email, перейдя по ссылке из письма, которое мы вам отправили на почтовый ящик. Ссылка активна в течении 3-х суток.`)
        return res.redirect(req.url)

    } catch (error) {
        return next(error)
    }
}

export async function login(req, res, next) {

    try {
        
        if (req.session.user) {
            return res.redirect(`/`)
        }

        return res.render('users/login', {
            title: 'Авторизация',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
        })
    } catch (error) {
        return next(error)
    }
}

export async function loginHandler(req, res, next) {

    try {

        if (req.session.user) {
            req.flash('type', 'warn')
            req.flash('message', `Вы уже авторизовались.`)
            return res.redirect(`/`)
        }

        const login = String(req.body.login).trim()
        const password = String(req.body.password)

        // Valid login or email
        if ((!login || login === 'undefined')) {
            req.flash('type', 'warn')
            req.flash('message', `Введите логин.`)
            return res.redirect(req.url)
        }
        // valid password
        if (!password || password === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль.`)
            return res.redirect(req.url)
        }
        if (/^[a-zA-Z]+([-_]?[a-zA-Z0-9]+){0,2}$/.test(login) === false) {

            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.url)
        }
        if (bannedLoginPassword.passwords.indexOf(password.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.url)
        }

        const data = await models.users.findOne({
            where: {
                login: {
                    [Op.eq]: login
                }
            },
            include: {
                model: models.authorizations,
                as: 'userAuthorizations'
            },
            attrubutes: ['id', 'password']
        })

        if (!data) {
            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.url)
        }

        if (!data.validPassword(password)) {

            await models.authorizations.create({
                user_id: data.id,
                type: 2,
                status: 2,
                os: req.useragent.os,
                platform: req.useragent.platform,
                browser: `${req.useragent.browser} version: ${req.useragent.version}`,
                ip: req.connection.remoteAddress,
            })

            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.url)
        }

        req.session.user = {
            id: data.id
        }

        models.authorizations.create({
            user_id: data.id,
            type: 2,
            status: 1,
            os: req.useragent.os,
            platform: req.useragent.platform,
            browser: `${req.useragent.browser} version: ${req.useragent.version}`,
            ip: req.connection.remoteAddress,
        })

        req.flash('type', 'info')
        req.flash('message', `Вы успешно вошли в систему.`)
        return res.redirect('/')
    } catch (error) {
        return next(error)
    }
}

export async function logout(req, res, next) {

    try {

        if (req.session.user) {
            req.session.user = null
        }

        return res.redirect(`/login`)
    } catch (error) {
        return next(error)
    }
}

export async function confirm(req, res, next) {

    try {

        const token = String(req.params.token)

        let data = await models.emailTokens.update({
            status: 3
        }, {
            where: {
                token: {
                    [Op.eq]: token
                },
                expired_at: {
                    [Op.gte]: new Date()
                },
                status: {
                    [Op.eq]: 1
                }
            },
            returning: true
        })

        if (data[0] <= 0) {
            return next(Error('notFound'))
        }

        await models.users.update({
            status_email: 1
        },{
            where: {
                id: {
                    [Op.eq]: data[1][0].user_id
                },
                status_email: {
                    [Op.ne]: 1
                }
            }
        })

        req.flash('type', 'info')
        req.flash('message', `Ваш email успешно подтвержден.`)
        return res.redirect(`/`)
    } catch (error) {
        return next(error)
    }
}

export async function recovery(req, res, next) {

    try {

        if (req.session.user) {
            return res.redirect(`/`)
        }

        return res.render('users/recovery', {
            title: 'Восстановление доступа',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
        })
    } catch (error) {
        return next(error)
    }
}

export async function recoveryHandler(req, res, next) {

    try {

        if (req.session.user) {
            req.flash('type', 'warn')
            req.flash('message', `Вы уже авторизовались.`)
            return res.redirect(`/`)
        }

        const email = String(req.body.email).trim().toLowerCase()

        // Valid email
        if (!email || email === 'undefined' || !validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите email.`)
            return res.redirect(req.url)
        }
        if (!validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите корректный email.`)
            return res.redirect(req.url)
        }

        const data = await models.users.findOne({
            where: {
                email: {
                    [Op.eq]: email
                },
                deleted_at: {
                    [Op.eq]: null
                }
            },
            attrubutes: ['id', 'email']
        })

        if (!data) {
            req.flash('type', 'warn')
            req.flash('message', `Ваш аккаунт не найден.`)
            return res.redirect(req.url)
        }

        const token = crypto.randomBytes(55).toString('hex')

        await models.emailTokens.create({
            user_id: newUser.id,
            token: token,
            expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            type: 2,
            status: 1,
            data: {
                email: newUser.email
            }
        })

        servises.email.send({
            email: email,
            subject: 'Восстановление доступа',
            body: emails.restore({
                login: newUser.login,
                token: token
            })
        })

        req.flash('type', 'info')
        req.flash('message', `На ваш email было отправленно письмо с дальнейшими инструкциями.`)
        return res.redirect('/')
    } catch (error) {
        return next(error)
    }
}
