import validator from 'validator'
import { Op } from 'sequelize'
import bcrypt from 'bcrypt'

import * as models from '../../models'
import { emails } from '../../templates'
import { bannedLoginPassword } from '../../constants'
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
        return next(error)
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
        const passwordConfirm = String(req.body.passwordConfirm)
        const consent = Number(req.body.consent)
        let ref = String(req.query.ref)

        // Valid login
        if (!login || login === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите логин.`)
            return res.redirect(req.originalUrl)
        }
        if (/^[a-zA-Z]+([-_]?[a-zA-Z0-9]+){0,2}$/.test(login) === false) {

            req.flash('type', 'warn')
            req.flash('message', `В логине должны быть только латинские буквы, цифры и знаки - _, но не более одного знака подряд. Логин должен начинатся с буквы, а оканчиватся буквой или цифрой!`)
            return res.redirect(req.originalUrl)
        }
        if (bannedLoginPassword.logins.indexOf(login.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Данный логин уже занят, попробуйте дургой.`)
            return res.redirect(req.originalUrl)
        }
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
        // valid password
        if (!password || password === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль.`)
            return res.redirect(req.originalUrl)
        }
        if (!passwordConfirm || passwordConfirm === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль повторно.`)
            return res.redirect(req.originalUrl)
        }
        if (password != passwordConfirm) {
            req.flash('type', 'warn')
            req.flash('message', `Пароли не совпадают.`)
            return res.redirect(req.originalUrl)
        }
        if (password.length < 7 || password.length > 60) {

            req.flash('type', 'warn')
            req.flash('message', `Пароль должен быть не менее 7 символов и не более 60.`)
            return res.redirect(req.originalUrl)
        }
        if (password.toLowerCase().indexOf(login.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Пожалуйста, не используйте в пароле свой логин, это может быть не безопасно!`)
            return res.redirect(req.originalUrl)
        }
        if (bannedLoginPassword.passwords.indexOf(password.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Пожалуйста, не используйте стандартные пароли, это может быть не безопасно!`)
            return res.redirect(req.originalUrl)
        }
        if (consent != 1) {
            req.flash('type', 'warn')
            req.flash('message', `Нельзя зарегистрировать аккаунт, не приняв политику конфидициальности и правил сервиса.`)
            return res.redirect(req.originalUrl)
        }

        let search = await models.users.findOne({
            where: {
                [Op.or]: [
                    {
                        login: {
                            [Op.like]: login
                        }
                    }, {
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
                return res.redirect(req.originalUrl)
            }

            if (search.email === email) {

                req.flash('type', 'warn')
                req.flash('message', `Аккаунт с данным email уже создан, укажите другой email.`)
                return res.redirect(req.originalUrl)
            }
        }

        if (ref && ref != 'undefined') {

            ref = models.users.prototype.hashId(ref)

            if (ref) {

                let refUser = await models.users.findOne({
                    where: {
                        id: {
                            [Op.eq]: ref
                        },
                        status: {
                            [Op.ne]: 0
                        }
                    },
                    atrributes: ['id']
                })

                if (refUser) {
                    ref = refUser.id
                } else {
                    ref = null
                }
            } else {
                ref = null
            }
        } else {
            ref = null
        }

        const newUser = await models.users.create({
            login: login,
            email: email,
            role: 1,
            status: 1,
            status_email: 2,
            password: password,
            ref: ref
        })

        const createTokens = await models.emailTokens.create({
            user_id: newUser.id,
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
                token: createTokens.token
            })
        })

        req.flash('type', 'info')
        req.flash('message', `Аккаунт успешно создан, подтвердите пожалуйста ваш email, перейдя по ссылке из письма, которое мы вам отправили на почтовый ящик. Ссылка активна в течении 3-х суток.`)
        return res.redirect(req.originalUrl)

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
            return res.redirect(req.originalUrl)
        }
        // valid password
        if (!password || password === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль.`)
            return res.redirect(req.originalUrl)
        }
        if (/^[a-zA-Z]+([-_]?[a-zA-Z0-9]+){0,2}$/.test(login) === false) {

            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.originalUrl)
        }
        if (bannedLoginPassword.passwords.indexOf(password.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.originalUrl)
        }

        const data = await models.users.findOne({
            where: {
                login: {
                    [Op.eq]: login
                },
                deleted_at: {
                    [Op.eq]: null
                }
            },
            attrubutes: ['id', 'password'],
            include: {
                model: models.authorizations,
                as: 'userAuthorizations'
            }
        })

        if (!data) {
            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.originalUrl)
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
            return res.redirect(req.originalUrl)
        }

        if (data.status === 0) {
            req.flash('type', 'warn')
            req.flash('message', `Ваш аккаунт заблокирован.`)
            return res.redirect(req.originalUrl)
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
            servises.cash.deleteCashUser(req.session.user.id)
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
        }, {
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
            req.flash('type', 'warn')
            req.flash('message', `Вы уже авторизовались.`)
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
            return res.redirect(req.originalUrl)
        }
        if (!validator.isEmail(email)) {
            req.flash('type', 'warn')
            req.flash('message', `Введите корректный email.`)
            return res.redirect(req.originalUrl)
        }

        const data = await models.users.findOne({
            where: {
                email: {
                    [Op.eq]: email
                },
                status: {
                    [Op.ne]: 0
                },
                deleted_at: {
                    [Op.eq]: null
                }
            },
            attrubutes: ['id', 'email', 'login']
        })

        if (!data) {
            req.flash('type', 'warn')
            req.flash('message', `Ваш аккаунт не найден.`)
            return res.redirect(req.originalUrl)
        }

        const createTokens = await models.emailTokens.create({
            user_id: data.id,
            expired_at: new Date(Date.now() + 1000 * 60 * 60 * 5),
            type: 2,
            status: 1,
            data: {
                email: data.email
            }
        })

        await servises.email.send({
            email: email,
            subject: 'Восстановление доступа',
            body: emails.restore({
                login: data.login,
                token: createTokens.token
            })
        })

        req.flash('type', 'info')
        req.flash('message', `На ваш email было отправленно письмо с дальнейшими инструкциями. Письмо актуально в течении 5 часов.`)
        return res.redirect('/')
    } catch (error) {
        return next(error)
    }
}

export async function recoveryFinish(req, res, next) {

    try {

        if (req.session.user) {
            req.flash('type', 'warn')
            req.flash('message', `Вы уже авторизовались.`)
            return res.redirect(`/`)
        }

        const token = String(req.params.token)

        if (req.session.recovery) {

            if (token != req.session.recovery.token) {
                req.session.recovery = null
                return next(Error('notFound'))
            }
        } else {

            const data = await models.emailTokens.findOne({
                where: {
                    token: {
                        [Op.eq]: token
                    },
                    expired_at: {
                        [Op.gte]: new Date()
                    },
                    type: {
                        [Op.eq]: 2
                    },
                    status: {
                        [Op.eq]: 1
                    }
                },
                include: {
                    model: models.users,
                    as: 'userEmailTokens',
                    attrubutes: ['status', 'login', 'id'],
                    where: {
                        status: {
                            [Op.ne]: 0
                        }
                    }
                }
            })

            if (!data) {
                return next(Error('notFound'))
            }

            await models.emailTokens.update({
                status: 2
            }, {
                where: {
                    id: {
                        [Op.eq]: data.id
                    }
                }
            })

            req.session.recovery = {
                expiredAt: new Date(Date.now() + 1000 * 60 * 30),
                token: token,
                idDb: data.id,
                login: data.userEmailTokens.login,
                idUser: data.userEmailTokens.id,
                requests: 0
            }
        }

        return res.render('users/recovery_finish', {
            title: 'Завершение процедуры восстановления доступа',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            }
        })
    } catch (error) {
        return next(error)
    }
}

export async function recoveryFinishHandler(req, res, next) {

    try {

        if (req.session.user) {
            req.flash('type', 'warn')
            req.flash('message', `Вы уже авторизовались.`)
            return res.redirect(`/`)
        }

        const token = String(req.params.token)

        if (!req.session.recovery) {
            return next(Error('notFound'))
        }

        if (token != req.session.recovery.token) {
            req.session.recovery = null
            return next(Error('notFound'))
        }

        if (new Date(req.session.recovery.expiredAt) < new Date()) {

            req.session.recovery = null
            req.flash('type', 'warn')
            req.flash('message', `Время на восстановление доступа вышло, в целях безопасности повторите восстановление еще раз.`)
            return res.redirect('/login')
        }

        if (req.session.recovery.requests >= 20) {

            req.session.recovery = null
            req.flash('type', 'warn')
            req.flash('message', `Вы сделали слишком много запросов, в целях безопасности повторите восстановление еще раз.`)
            return res.redirect('/login')
        }

        req.session.recovery.requests++

        const password = String(req.body.password)
        const passwordConfirm = String(req.body.passwordConfirm)

        // valid password
        if (!password || password === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль.`)
            return res.redirect(req.originalUrl)
        }
        if (!passwordConfirm || passwordConfirm === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Введите пароль повторно.`)
            return res.redirect(req.originalUrl)
        }
        if (password != passwordConfirm) {
            req.flash('type', 'warn')
            req.flash('message', `Пароли не совпадают.`)
            return res.redirect(req.originalUrl)
        }
        if (password.length < 7 || password.length > 60) {

            req.flash('type', 'warn')
            req.flash('message', `Пароль должен быть не менее 7 символов и не более 60.`)
            return res.redirect(req.originalUrl)
        }
        if (password.toLowerCase().indexOf(req.session.recovery.login.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Пожалуйста, не используйте в пароле свой логин, это может быть не безопасно!`)
            return res.redirect(req.originalUrl)
        }
        if (bannedLoginPassword.passwords.indexOf(password.toLowerCase()) != -1) {

            req.flash('type', 'warn')
            req.flash('message', `Пожалуйста, не используйте стандартные пароли, это может быть не безопасно!`)
            return res.redirect(req.originalUrl)
        }

        const saltRounds = 10
        const salt = bcrypt.genSaltSync(saltRounds)
        const hash = bcrypt.hashSync(password, salt)

        const updateEmailTokens = await models.emailTokens.update({
            status: 3
        }, {
            where: {
                id: {
                    [Op.eq]: req.session.recovery.idDb
                },
                status: {
                    [Op.eq]: 2
                },
                type: {
                    [Op.eq]: 2
                }
            }
        })

        if (updateEmailTokens != 1) {

            return next(Error('Error update status emailTokens'))
        }

        await models.users.update({
            password: hash
        }, {
            where: {
                id: {
                    [Op.eq]: req.session.recovery.idUser
                },
                status: {
                    [Op.ne]: 0
                }
            }
        })

        req.session.recovery = null

        req.flash('type', 'info')
        req.flash('message', `Ваш пароль успешно восстановлен.`)
        return res.redirect('/login')

    } catch (error) {
        return next(error)
    }
}