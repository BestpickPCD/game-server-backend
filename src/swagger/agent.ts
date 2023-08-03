export default {
  '/agents': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Get agents based on query parameters',
      tags: ['Agents'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          type: 'number'
        },
        {
          name: 'size',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          type: 'number'
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search query',
          required: false,
          type: 'string'
        },
        {
          name: 'dateFrom',
          in: 'query',
          description: 'Start date',
          required: false,
          type: 'string'
        },
        {
          name: 'dateTo',
          in: 'query',
          description: 'End date',
          required: false,
          type: 'string'
        },
        {
          name: 'level',
          in: 'query',
          description: 'Level',
          required: false,
          type: 'number'
        },
        {
          name: 'id',
          in: 'query',
          description: 'Number',
          required: false,
          type: 'number'
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
  '/agents/{agentId}': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Get agent detail by agentId',
      tags: ['Agents'],
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          description: 'ID of the user to retrieve',
          required: true,
          type: 'number'
        }
      ],
      responses: {
        '200': {
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'object'
              },
              messages: {
                type: 'string'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized'
        },
        '404': {
          description: 'NOT_FOUND'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    },
    delete: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Delete agent by agentId',
      tags: ['Agents'],
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          description: 'ID of the agent to retrieve',
          required: true,
          type: 'number'
        }
      ],
      responses: {
        '200': {
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'object'
              },
              messages: {
                type: 'string'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized'
        },
        '404': {
          description: 'NOT_FOUND'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    },
    put: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Update agent by agentId',
      tags: ['Agents'],
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          description: 'ID of the agent to retrieve',
          required: true,
          type: 'number'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                parentAgentId: {
                  type: 'number'
                },
                roleId: {
                  type: 'number'
                },
                currencyId: {
                  type: 'number'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Success',
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'object'
              },
              messages: {
                type: 'string'
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized'
        },
        '404': {
          description: 'NOT_FOUND'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    }
  }
};
