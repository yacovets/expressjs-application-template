import Sequelize from 'sequelize'
import bcrypt from 'bcrypt'
import { Op } from 'sequelize'

import sequelize from '../include/db'

// 1 - прочитано
// 2 - не прочитано

// type
// 1 - клиент
// 2 - админ
// 3 - массовая рассылка из админки

const model = sequelize.define('notifications', {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        foreignKey: true
    },
    admin_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        foreignKey: true
    },
    parental_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        foreignKey: true
    },
    type: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    level: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    text: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    status: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    data: {
        type: Sequelize.JSONB,
        allowNull: true
    }
})

export default model