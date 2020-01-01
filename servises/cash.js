import { Op } from 'sequelize'

import client from '../include/redis'
import * as models from '../models'

const adminSecretPath = process.env.ADMIN_SECRET_PATH
const expiredCash = Number(process.env.EXPIRED_REDIS_CASH)

export async function accessUsers(req, res, next) {

    try {

        if (!req.session || !req.session.user || !req.session.user.id) {

            req.flash('type', 'warn')
            req.flash('message', 'Need login')
            return res.redirect(`/admin/${adminSecretPath}/login`)
        }

        const id = req.session.user.id
        const key = `user_${id}`

        let data = await client.get(key)

        if (data) {

            data = JSON.parse(data)
        }

        if (!data) {

            const dataDb = await models.users.findOne({
                where: {
                    id: {
                        [Op.eq]: id
                    }
                }
            })

            if (!dataDb) {

                req.flash('type', 'warn');
                req.flash('message', 'Acc not found');
                return res.redirect(`/admin/${adminSecretPath}/login`)
            }

            data = {
                id: dataDb.id,
                role: dataDb.role,
                login: dataDb.login,
                status: dataDb.status,
                email: dataDb.email,
            }

            await client.set(key, JSON.stringify(data), 'EX', expiredCash)
        }

        if (data.status === 0) {

            req.flash('type', 'warn');
            req.flash('message', 'Block acc');
            return res.redirect(`/admin/${adminSecretPath}/login`)
        }

        req.user = data
        return next()

    } catch (error) {
        return next(error)
    }
}