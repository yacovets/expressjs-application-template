import users from './users'
import admins from './admins'
import errors from './errors'

export default app => {

    users(app)
    admins(app)
    errors(app)
}