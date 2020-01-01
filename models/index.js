import sequelize from '../include/db'

import users from './users'

;(async () => {

    try {

        await sequelize.sync({ force: false })
        console.log(`Sync database`)
    } catch (error) {

        console.error('Error synchronization database', error)
    }
})()

export { users }