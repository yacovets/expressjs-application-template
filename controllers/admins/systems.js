import validator from 'validator'
import { Op } from 'sequelize'
import bcrypt from 'bcrypt'

import * as models from '../../models'
import { emails } from '../../templates'
import { bannedLoginPassword } from '../../constants'
import * as servises from '../../servises'
import client from '../../include/redis'

export async function get(req, res, next) {

    try {

        let resRedis = await client.eval(`return {redis.call('get', 'cp_systems_technical_work'), redis.call('get', 'cp_systems_message_top')}`, 1, ``)

        let technicalWork = resRedis[0]

        if (technicalWork) {

            technicalWork = JSON.parse(technicalWork)
        } else {
            technicalWork = {
                status: 0,
                message: null
            }
        }

        let message = resRedis[1]

        if (message) {

            message = JSON.parse(message)
        } else {
            message = {
                message: null
            }
        }

        return res.render('admins/systems', {
            title: 'Страница системных настроек',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: {
                technicalWork: technicalWork,
                message: message
            }
        })
    } catch (error) {
        return next(error)
    }
}

export async function technicalWork(req, res, next) {

    try {

        const status = Number(req.body.status)
        const message = String(req.body.message).trim()

        if ([0, 1, 2].indexOf(status) === -1) {
            req.flash('type', 'warn')
            req.flash('message', `Выберите статус.`)
            return res.redirect(`/admin/systems`)
        }
        if (!message || message === 'undefined') {
            req.flash('type', 'warn')
            req.flash('message', `Выберите статус.`)
            return res.redirect(`/admin/systems`)
        }

        await client.set(`systems_technical_work`, JSON.stringify({
            status: status,
            message: message
        }))

        req.flash('type', 'info')
        req.flash('message', `Статус технических работ изменён`)
        return res.redirect(`/admin/systems`)
    } catch (error) {
        return next(error)
    }
}

export async function message(req, res, next) {

    try {

        let message = String(req.body.message).trim()

        if (!message || message === 'undefined') {
            message = null
        }

        await client.set(`systems_message_top`, JSON.stringify({
            message: message
        }))

        req.flash('type', 'info')
        req.flash('message', `Сообщение измененно`)
        return res.redirect(`/admin/systems`)
    } catch (error) {
        return next(error)
    }
}