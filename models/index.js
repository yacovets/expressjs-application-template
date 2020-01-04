import sequelize from '../include/db'

import users from './users'
import authorizations from './authorizations'
import emailTokens from './email_tokens'
import notifications from './notifications'

users.hasMany(authorizations, { foreignKey: 'user_id', as: 'userAuthorizations' })
authorizations.belongsTo(users, { foreignKey: 'user_id', as: 'userAuthorizations' })

users.hasMany(emailTokens, { foreignKey: 'user_id', as: 'userEmailTokens' })
emailTokens.belongsTo(users, { foreignKey: 'user_id', as: 'userEmailTokens' })

users.hasMany(users, { foreignKey: 'ref', as: 'refList' })
users.belongsTo(users, { foreignKey: 'ref', as: 'userRef' })

users.hasMany(notifications, { foreignKey: 'user_id', as: 'userNotifications' })
notifications.belongsTo(users, { foreignKey: 'user_id', as: 'userNotifications' })

users.hasMany(notifications, { foreignKey: 'admin_id', as: 'adminNotifications' })
notifications.belongsTo(users, { foreignKey: 'admin_id', as: 'adminNotifications' })

notifications.hasMany(notifications, { foreignKey: 'parental_id', as: 'notificationsParentalList' })
notifications.belongsTo(notifications, { foreignKey: 'parental', as: 'notificationsParental' })

;(async () => {

    try {

        await sequelize.sync({ force: false })
        console.log(`Sync database`)
    } catch (error) {

        console.error('Error synchronization database', error)
    }
})()

export { users, authorizations, emailTokens, notifications }