import Sequelize from 'sequelize'
import bcrypt from 'bcrypt'
import { Op } from 'sequelize'

import sequelize from '../include/db'

// status
// 0 - заблокирован
// 1 - активный

// status_email
// 1 - верифицирован
// 2 - не верифицирован

const model = sequelize.define('users', {
    login: {
        type: Sequelize.STRING,
        allowNull: true,
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
    status_email: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2
    },
    ref: {
        type: Sequelize.INTEGER,
        allowNull: true,
        foreignKey: true
    },
    data: {
        type: Sequelize.JSONB,
        allowNull: true
    },
    deleted_at: {
        type: Sequelize.DATE,
    }
})

model.prototype.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

model.beforeSave((user, options) => {
    const {
        password
    } = user;

    var saltRounds = 10;
    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(password, salt);
    return user.password = hash;
});

model.beforeBulkCreate((users, options) => {
    for (const user of users) {
        const {
            password
        } = user;

        var saltRounds = 10;
        var salt = bcrypt.genSaltSync(saltRounds);
        var hash = bcrypt.hashSync(password, salt);
        user.password = hash;
    }
});

// model.beforeBulkUpdate((users, options) => {

//     console.log('user')
//     console.log(users)
//     // console.log('options')
//     // console.log(options)

//     for (const user of users) {

//         const {
//             password
//         } = user;

//         var saltRounds = 10;
//         var salt = bcrypt.genSaltSync(saltRounds);
//         var hash = bcrypt.hashSync(password, salt);
//         user.password = hash;
//     }
// });

export default model