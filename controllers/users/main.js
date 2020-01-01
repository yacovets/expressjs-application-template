import validator from 'validator'
import { Op } from 'sequelize'

import * as models from '../../models'
import { bannedLoginPassword } from '../../templates'

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
        const email = String(req.body.email).trim()
        const password = String(req.body.password)
        const passwordConfirm = String(req.body.password)

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
        if (!password != passwordConfirm) {
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

        await models.users.create({
            login: login,
            email: email,
            role: 1,
            status: 1,
            status_email: 2,
            password: password
        })

        req.flash('type', 'info')
        req.flash('message', `Аккаунт успешно создан, подтвержите пожалуйста ваш email, перейдя по ссылке из письма, которое мы вам отправили на почтовый ящик.`)
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
                type: 2,
                status: 2
            })

            req.flash('type', 'warn')
            req.flash('message', `Не верные логин или пароль.`)
            return res.redirect(req.url)
        }

        req.session.user = {
            id: data.id
        }

        req.flash('type', 'info')
        req.flash('message', `Вы успешно вошли в систему.`)
        return res.redirect('/')
    } catch (error) {
        return next(error)
    }
}
