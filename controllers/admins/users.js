import { Op } from 'sequelize'

import * as models from '../../models'
import { names } from '../../constants'
import * as servises from '../../servises'

export async function get(req, res, next) {

    try {

        let page = Number(req.query.page)
        let search = Number(req.query.search)

		const limit = 100

		if (!page || page <= 0) {

			page = 1
		}

		let where = {}

		if (search && search != undefined) {

			where.login = {
                [Op.like]: `%${search}%`
            }
        }
        
        const data = await models.users.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: limit * (page - 1),
        })

        let users = data.rows

        users = servises.func.formatDateDb({
            data: users,
            type: 'copy'
        })

        for (const user of users) {

            user.roleName = names.role[user.role] ? names.role[user.role].name : `role:${user.role}`
            user.statusName = names.status[user.status] ? names.status[user.status].name : `status:${user.role}`
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