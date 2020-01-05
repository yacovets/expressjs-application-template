import { Op } from 'sequelize'

import * as models from '../models'
import client from '../include/redis'

export function send (data) {

    return new Promise(async (resolve, reject) => {
        
        try {

            let resCreated = await models.notifications.create({
                user_id: data.user,
                admin_id: data.admin || null,
                type: data.type || null,
                level: data.level || 1,
                status: 2,
                name: data.name,
                text: data.text,
            })

            let dataSave = {
                id: resCreated.id,
                name: data.name,
                level: resCreated.level,
                createdAt: resCreated.createdAt
            }

            const key = `notifications_user_${data.user}`

            let countCash = await client.lpush(key, JSON.stringify(dataSave))
            
            resCreated.dataValues.countCash = countCash

            resolve(resCreated.dataValues)
        } catch (error) {
            reject(error)
        }
    })
}

export async function deleteAll (id) {

    try {

        const key = `notifications_user_${id}`

        await client.del(key)

        return true
    } catch (error) {
        return error
    }
}