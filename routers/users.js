import { users } from '../controllers'
import { cash } from '../servises'
import { userBruteforce, globalBruteforce } from '../include/bruteforce'

export default app => {

    app.get('/', cash.accessUsers(), users.main.home)

    app.get('/register', users.main.register)
    app.post('/register', globalBruteforce.prevent, users.main.registerHandler)

    app.get('/login', users.main.login)
    app.post('/login', globalBruteforce.prevent, users.main.loginHandler)

    app.get('/logout', users.main.logout)

    app.get('/recovery', users.main.recovery)
    app.post('/recovery', globalBruteforce.prevent, users.main.recoveryHandler)
    app.get('/recovery/:token', users.main.recoveryFinish)
    app.post('/recovery/:token', globalBruteforce.prevent, users.main.recoveryFinishHandler)

    app.get('/confirm/:token', users.main.confirm)
}