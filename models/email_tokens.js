import Sequelize from 'sequelize'

import sequelize from '../include/db'

// type
// 1 - подтверждение email
// 2 - восстановление доступа

// status
// 1 - перехода по ссылке нет
// 2 - переход есть, действие не завершено
// 3 - переход есть, дейсвтиве завершено

const model = sequelize.define('email_tokens', {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        foreignKey: true
    },
    token: {
        type: Sequelize.STRING,
        allowNull: true
    },
    expired_at: {
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
    data: {
        type: Sequelize.JSONB,
        allowNull: true
    },
    deleted_at: {
        type: Sequelize.DATE,
    }
})


export default model