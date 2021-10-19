import dotenv from 'dotenv'
import * as path from 'path'
import Joi from 'joi'

dotenv.config({ path: path.join(path.dirname('../'), '.env') })

const envStruct = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'local', 'test').required(),
    PORT: Joi.number().default(3000),
    DB_CONNECTION: Joi.string().required().description('DB Connection '),
    DB_HOST: Joi.string().required().description('DB Host '),
    DB_PORT: Joi.string().required().description('DB Port '),
    DB_NAME: Joi.string().required().description('DB Name '),
    DB_USERNAME: Joi.string().required().description('DB Username '),
    DB_PASSWORD: Joi.string().required().description('DB Password '),
  })
  .unknown()

const { value: envVars, error } = envStruct.prefs({ errors: { label: 'key' } }).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

function getDBNAME(DBName) {
    return envVars.DB_NAME + (envVars.NODE_ENV === 'test' ? '-test' : '')
}

const dbConnections = {
    postgres: {
        url: 'postgres://' + 
            envVars.DB_USERNAME + ':' + 
            envVars.DB_USERNAME + '@' +
            envVars.DB_HOST + ':' + 
            envVars.DB_PORT + '/' + 
            getDBNAME(envVars.DB_NAME),
        options: {
            logging: false
        }
    },
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  dbConnection: dbConnections[envVars.DB_CONNECTION]
}