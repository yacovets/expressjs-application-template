import Sequelize from 'sequelize'

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    pool: {
        max: Number(process.env.DB_POOL_MAX),
        min: Number(process.env.DB_POOL_MIN),
        idle: Number(process.env.DB_POOL_IDLE),
        acquire: Number(process.env.DB_POOL_ACQUIRE)
    },
    logging: false
});

(async () => {
    try {

        await sequelize.authenticate()
        console.log('Сonnected to database')
    } catch (error) {

        console.error('Error connecting to database')
        console.error(error)
        process.kill(process.pid, 'SIGTERM')
    }
})()

export default sequelize