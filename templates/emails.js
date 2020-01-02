const urlApp = process.env.APP_URL
const nameApp = process.env.APP_NAME

export function confirmEmail(data) {

    return `
    <h3>
    Привет ${data.login}. Спасибо за регистрацию в сервисе <b>${nameApp}</b>
    <br>
    Для завершения регистрации и подтверждения своего email, перейдите по ссылке ниже.
    <br>
    <br>
    <a href="${urlApp}/confirm/${data.token}">Завершить регистрацию</a>
    </h3>
    `
}

export function restore() {

    return `
    <h3>
    Привет ${data.login}. Запущена процедура восстановление доступа к аккаунту <b>${nameApp}</b>
    <br>
    Для завершения, перейдите по ссылке ниже.
    <br>
    <br>
    <a href="${urlApp}/restore/${data.token}">Завершить восстановление доступа</a>
    </h3>
    `
}