import sequelize from '../include/db'

import users from './users'
import authorizations from './authorizations'

users.hasMany(authorizations, { foreignKey: 'user_id', as: 'userAuthorizations' })
authorizations.belongsTo(users, { foreignKey: 'user_id', as: 'userAuthorizations' })

;(async () => {

    try {

        await sequelize.sync({ force: false })
        console.log(`Sync database`)
    } catch (error) {

        console.error('Error synchronization database', error)
    }
})()

export { users }