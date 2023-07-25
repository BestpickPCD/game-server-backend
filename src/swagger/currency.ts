export default {
  '/currencies': {
    get: {
      summary: 'Currencies',
      tags: ['currencies'],
      consumes: ['application/json'],
      produces: ['application/json'], 
      responses: {
        '200': {
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string'
              },
              refreshToken: {
                type: 'string'
              }
            }
          }
        },
        '404': {
          description: 'NOT_FOUND'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    }
  },
  '/currency': {
    get: {
      summary: 'Add Currency',
      tags: ['currencies'],
      consumes: ['application/json'],
      produces: ['application/json'], 
      responses: {
        '200': {
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              code: {
                type: 'string'
              }
            }
          }
        },
        '404': {
          description: 'NOT_FOUND'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    }
  }, 
};
