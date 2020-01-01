import emailjs from 'emailjs'

const email = emailjs.server.connect({
    user: process.env.GMAIL_LOGIN,
    password: process.env.GMAIL_PASSWORD,
    host: "smtp.gmail.com",
    ssl: true,
    port: 465,
    tls: false
})

 export default email