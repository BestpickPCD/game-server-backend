import userJson from './user.ts';
import currencyJson from './currency.ts';
export default {
  swaggerDefinition: {
    openapi: '3.0.1', // YOU NEED THIS
    info: {
      title: 'Your API title',
      version: '1.0.0',
      description: 'Your API description'
    },
    basePath: '/',
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header', // Specify where the bearer token will be passed (e.g., 'header', 'query', etc.)
          name: 'Authorization' // Specify the name of the header or query parameter carrying the bearer token
        }
      }
    },
    paths: {
      ...userJson,
      ...currencyJson,
    },
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization'
      }
    }
  },
  apis: []
};
