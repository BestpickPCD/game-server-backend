export default {
  '/currencies': {
    get: {
      summary: 'Get all currencies',
      tags: ['Currencies'],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {}
              }
            }
          }
        },
        '500': {
          description: 'Internal server error'
        }
      }
    }
  },
  '/currency': {
    post: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Add a new currency',
      tags: ['Currencies'],
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
                code: {
                  type: 'string'
                }
              },
              required: ['name', 'code']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Currency created',
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
          description: 'Currency exists',
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
  },
  '/currency/{currencyId}': {
    put: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Update currency by currencyId',
      tags: ['Currencies'],
      parameters: [
        {
          name: 'currencyId',
          in: 'path',
          description: 'ID of the currency to retrieve',
          required: true,
          schema: {
            type: 'integer',
            format: 'int64'
          }
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
                code: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
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
  '/currency/{currency-id}': {
    delete: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Delete currency by currencyId',
      tags: ['Currencies'],
      parameters: [
        {
          name: 'currency-id',
          in: 'path',
          description: 'ID of the currency to retrieve',
          required: true,
          schema: {
            type: 'integer',
            format: 'int64'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
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
  }
};
