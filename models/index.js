import sequelize from '../include/db'

import users from './users'
import authorizations from './authorizations'
import emailTokens from './email_tokens'

users.hasMany(authorizations, { foreignKey: 'user_id', as: 'userAuthorizations' })
authorizations.belongsTo(users, { foreignKey: 'user_id', as: 'userAuthorizations' })

users.hasMany(emailTokens, { foreignKey: 'user_id', as: 'userEmailTokens' })
emailTokens.belongsTo(users, { foreignKey: 'user_id', as: 'userEmailTokens' })

users.hasMany(users, { foreignKey: 'ref', as: 'refList' })
users.belongsTo(users, { foreignKey: 'ref', as: 'userRef' })

;(async () => {

    try {

        await sequelize.sync({ force: false })
        console.log(`Sync database`)
    } catch (error) {

        console.error('Error synchronization database', error)
    }
})()

export { users, authorizations, emailTokens }