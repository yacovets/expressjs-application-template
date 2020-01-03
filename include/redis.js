import redis from 'redis'
import asyncRedis from 'async-redis'

const client = redis.createClient({
    prefix: 'cp_',
    family: 'IPv6'
})

client.on("connect", () => {

    console.log(`Connect to redis`)
})
client.on("error", error => {

    console.error(error)
})

const asyncRedisClient = asyncRedis.decorate(client)

export default asyncRedisClient