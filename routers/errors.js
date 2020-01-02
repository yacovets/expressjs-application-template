export default app => {

    app.use((error, req, res, next) => {

        console.log(error)

        if (error.message === 'notFound') {

            return next()
        } else if (error.message === 'limiter') {

            res.status(429)
            return res.render('errors/error_429', {
                title: 'Error 429',
                info: {}
            })
        } else {

            res.status(500)
            return res.render('errors/error_500', {
                title: 'Error 500',
                info: {}
            })
        }
    })

    app.use((req, res) => {

        res.status(404)
        return res.render('errors/error_404', {
            title: 'Error 404',
            info: {}
        })
    })
}