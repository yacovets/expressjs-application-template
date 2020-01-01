import dotenv from 'dotenv'

const dotenvResConnect = dotenv.config()

if (dotenvResConnect.error) {
    throw dotenvResConnect.error
}