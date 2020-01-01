import express from 'express'
import engine from 'ejs-locals'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import http from 'http'
import compression from 'compression'
import csrf from 'csurf'
import flash from 'connect-flash'

import './include/env'
// import './crons'
import limiter from './include/limiter'
import session from './include/session'
import routersModule from './routers'

const app = express()

// Setting app
app.use(helmet())
app.use(compression())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '100kb'
}))
app.use(bodyParser.json({
    extended: true,
    limit: '100kb'
}))
app.use(limiter)
// app.use(cookieParser())
app.use(session)
app.use(flash())
app.use(csrf({
    cookie: true,
    ignoreMethods: ['GET']
}))

app.engine('ejs', engine)
app.set('views', `${__dirname}/views`)
app.set('view engine', 'ejs')

routersModule(app)

// Run app
const server = http.createServer(app)

server.listen(process.env.PORT, () => {

    console.log(`Start server on port ${process.env.PORT}. Instance #${process.env.NODE_APP_INSTANCE || ''}`)
})