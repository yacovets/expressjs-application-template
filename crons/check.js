import cron from 'node-cron'

cron.schedule('*/1 * * * *', () => {

    start()
})

async function start() {

    try {

        console.log(`Ok check cron`)
        return
    } catch (error) {

        console.error(`Error check cron`)
        console.error(error)
        return
    }
}