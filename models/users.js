import Sequelize from 'sequelize'

import sequelize from '../include/db'

// status
// 0 - заблокирован
// 1 - активный

const model = sequelize.define('users', {
    login: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    data: {
        type: Sequelize.JSONB,
        allowNull: true
    },
    deleted_at: {
        type: Sequelize.DATE,
    }
})

export default model