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

            if (data.status === 0) {

                req.flash('type', 'warn')
                req.flash('message', 'Ваш аккаунт заблокирован')
                return res.redirect(`/login`)
            }

            req.user = data

            if (!role && role.indexOf(data.role) === -1) {

                return next(Error('notFound'))
            }

            return next()

        } catch (error) {
            return next(error)
        }
    }
}