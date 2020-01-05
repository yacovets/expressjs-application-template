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