import Sequelize from 'sequelize'

import sequelize from '../include/db'

// type
// 1 - регистрация
// 2 - авторизация
// 3 - восстановление пароля

// status
// 1 - успешное действие
// 2 - серия не успешных действий 1-й степени
// 3 - серия не успешных действий 2-й степени
// 4 - серия не успешных действий 3-й степени
// 5 - серия не успешных действий 4-й степени

const model = sequelize.define('authorizations', {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        foreignKey: true
    },
    block_actions_at: {
        type: Sequelize.DATE,
        allowNull: true
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    type: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    ip: {
        type: Sequelize.STRING,
        allowNull: true
    },
    os: {
        type: Sequelize.STRING,
        allowNull: true
    },
    platform: {
        type: Sequelize.STRING,
        allowNull: true
    },
    browser: {
        type: Sequelize.STRING,
        allowNull: true
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