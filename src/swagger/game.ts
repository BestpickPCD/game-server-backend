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
  },
  '/game-contract': {
    post: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Add a new contract',
      tags: ['Games'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                agentId: {
                  type: 'number'
                },
                vendorId: {
                  type: 'number'
                }
              },
              required: ['name', 'code']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Contract created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Contract exists',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  },
                  error: {
                    type: 'object'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
