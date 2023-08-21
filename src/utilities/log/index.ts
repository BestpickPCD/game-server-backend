import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.File({
      filename: './src/utilities/log/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: './src/utilities/log/combined.log'
    })
  ]
});
export default logger;
