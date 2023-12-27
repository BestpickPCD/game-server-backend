import userJson from './user.ts';
import currencyJson from './currency.ts';
import transactionJson from './transaction.ts';
import agentJson from './agent.ts';
import gameJson from './game.ts';
export default {
  swaggerDefinition: {
    openapi: '3.0.1',
    info: {
      title: 'Game Server APIS',
      version: '1.0.0',
      description: 'Game Server APIS'
    },
    basePath: '/',
    components: {
      schemas: {
        CallbackInput: {
          type: 'object',
          properties: {
            callbackUrl: {
              type: 'string',
              format: 'uri',
              description: 'The callback URL'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'Authorization'
        }
      },
    },
    paths: {
      ...userJson,
      ...currencyJson,
      ...transactionJson,
      ...gameJson,
      ...agentJson
    },
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization'
      },
    }
  },
  apis: []
};
