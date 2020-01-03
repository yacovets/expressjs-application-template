import { Op } from 'sequelize'

import client from '../include/redis'
import * as models from '../models'

const expiredCash = Number(process.env.EXPIRED_REDIS_CASH)

export function accessUsers(role) {

    return async function (req, res, next) {

        try {

            if (!req.session.user || !req.session.user.id) {

                req.flash('type', 'warn')
                req.flash('message', 'Нужна авторизация')
                return res.redirect(`/login`)
            }

            const id = req.session.user.id
            const key = `user_${id}`

            let data = await client.get(key)

            if (data) {

                try {
                    data = JSON.parse(data)
                } catch (errorJson) {
                    data = null
                }
            }

            if (!data) {

                const dataDb = await models.users.findOne({
                    where: {
                        id: {
                            [Op.eq]: id
                        },
                        deleted_at: {
                            [Op.eq]: null
                        }
                    }
                })

                if (!dataDb) {

                    req.flash('type', 'warn');
                    req.flash('message', 'Аккаунт не найден');
                    return res.redirect(`/login`)
                }

                data = {
                    id: dataDb.id,
                    role: dataDb.role,
                    login: dataDb.login,
                    email: dataDb.email,
                    status: dataDb.status,
                }

                await client.set(key, JSON.stringify(data), 'EX', expiredCash)
            }

            let systems = await client.eval(`return {redis.call('get', 'cp_systems_technical_work'), redis.call('get', 'cp_systems_message_top')}`, 1, ``)

            let technicalWork = {
                status: 0,
                message: null
            }

            let message = {
                message: null
            }

            try {
                technicalWork = JSON.parse(systems[0])
            } catch(e) {}

            try {
                message = JSON.parse(systems[1])
            } catch(e) {}

            if (technicalWork.status > 0 && [2].indexOf(data.role) === -1) {

                return res.render('errors/technical_work', {
                    title: 'На сайте проводятся технические работы',
                    message: technicalWork.message
                })
            }

            if (data.status === 0) {

                req.flash('type', 'warn')
                req.flash('message', 'Ваш аккаунт заблокирован')
                return res.redirect(`/login`)
            }

            if (role && role.indexOf(data.role) === -1) {

                return next(Error('notFound'))
            }

            req.user = data
            req.user.message = message.message

            return next()

        } catch (error) {
            return next(error)
        }
    }
}

export async function deleteCashUser (id) {

    try {

        const key = `user_${id}`

        await client.del(key)

        return true
    } catch (error) {
        return error
    }
}