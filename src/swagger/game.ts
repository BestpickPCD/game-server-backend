export default {
  '/game-list': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Get games by Vendors',
      tags: ['Games'],
      parameters: [
        {
          name: 'vendors',
          in: 'query',
          description: 'evolution,ezugi',
          required: false,
          type: 'string'
        }
      ],
      responses: {
        '200': {
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      type: 'object'
                    }
                  }
                }
              },
              page: {
                type: 'number'
              },
              limit: {
                type: 'number'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    }
  }
};
