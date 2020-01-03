import { Op } from 'sequelize'

import * as models from '../../models'
import { names } from '../../constants'
import * as servises from '../../servises'

export async function get(req, res, next) {

    try {

        let page = Number(req.query.page)
        let search = String(req.query.search).trim()
        let ref = Number(req.query.ref)
        
		const limit = 100

		if (!page || page <= 0) {

			page = 1
		}

		let where = {}

		if (search && search != 'undefined') {

			where.login = {
                [Op.like]: `%${search}%`
            }
        }
        if (ref) {

            where.ref = {
                [Op.eq]: ref
            }
        }
        
        const data = await models.users.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.users,
                as: 'userRef',
                attributes: ['id', 'login']
            }],
            offset: limit * (page - 1),
        })

        let users = data.rows

        users = servises.func.formatDateDb({
            data: users,
            type: 'copy'
        })

        for (const user of users) {

            user.roleName = names.roleUser[user.role] ? names.roleUser[user.role].name : `role:${user.role}`
            user.statusName = names.statusUser[user.status] ? names.statusUser[user.status].name : `status:${user.status}`
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

export async function getOne(req, res, next) {

    try {

		const id = Number(req.params.id)
        
        let data = await models.users.findOne({
            where: {
                id: {
                    [Op.eq]: id
                }
            },
            include: [{
                model: models.users,
                as: 'userRef',
                attributes: ['id', 'login']
            }],
        })

        data = servises.func.formatDateDb({
            data: [data],
            type: 'copy'
        })[0]

        data.roleName = names.roleUser[data.role] ? names.roleUser[data.role].name : `role:${data.role}`
        data.statusName = names.statusUser[data.status] ? names.statusUser[data.status].name : `status:${data.role}`

        return res.render('admins/user', {
            title: 'Информация о пользователе',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: data
        })
    } catch (error) {
        return next(error)
    }
}