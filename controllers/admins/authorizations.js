import { Op } from 'sequelize'

import * as models from '../../models'
import { names } from '../../constants'
import * as servises from '../../servises'

export async function get(req, res, next) {

    try {

        let page = Number(req.query.page)
        let user = Number(req.query.user)
        
		const limit = 100

		if (!page || page <= 0) {

			page = 1
		}

		let where = {}

        if (user) {

            where.user_id = {
                [Op.eq]: user
            }
        }
        
        const data = await models.authorizations.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: models.users,
                as: 'userAuthorizations',
                attributes: ['id', 'login']
            }],
            offset: limit * (page - 1),
        })

        let authorizations = data.rows

        authorizations = servises.func.formatDateDb({
            data: authorizations,
            type: 'copy'
        })

        for (const one of authorizations) {

            one.typeName = names.typeAuthorizations[one.type] ? names.typeAuthorizations[one.type].name : `role:${one.type}`
            one.statusName = names.statusAuthorizations[one.status] ? names.statusAuthorizations[one.status].name : `status:${one.status}`
        } 
        
        return res.render('admins/authorizations', {
            title: 'История авторизаций',
            user: req.user,
            csrfToken: req.csrfToken(),
            info: {
                type: req.flash('type')[0],
                message: req.flash('message')[0]
            },
            data: authorizations,
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