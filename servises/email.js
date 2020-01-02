import email from '../include/email'

const fromSend = process.env.EMAIL_FROM_SEND

export async function send(data) {

    return new Promise(async (resolve, reject) => {

        var message = {
            from: `${data.subject} <${fromSend}>`,
            subject: data.subject,
            to: data.email,
            attachment:
                [
                    {
                        data: data.body,
                        alternative: true
                    }
                ]
        }

        email.send(message, (error, res) => {

            if (!error) {

                resolve(res)
            } else {
                reject(error)
            }
        })
    })
}