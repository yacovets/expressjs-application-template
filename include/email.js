import emailjs from 'emailjs'

const email = emailjs.server.connect({
    user: process.env.GMAIL_LOGIN,
    password: process.env.GMAIL_PASSWORD,
    host: "smtp.gmail.com",
    ssl: true,
    port: 465,
    tls: false
})

// email.send({
// 	from:    "Счёт на оплату | Cupicon <jenya.yacovets@gmail.com>", 
// 	subject: "Счёт на оплату | Cupicon",
// 	text:    `<h1>Тело письма</h1>`, 
// 	to:      "jenya.yacovets@gmail.com",
//  }, (error, result) => {

//     if (!error) {
//         console.log(result)
//     } else {
//         console.error(error)
//     }
//  })

 export default email