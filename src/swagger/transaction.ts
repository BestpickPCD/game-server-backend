export default { 
  '/transactions': {
    get: {
      summary: 'Get all transactions',
      tags: ['Transactions'],
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  },
                  transactions: {
                    type: 'array',
                    items: { }
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
  '/transaction': {
    post: { 
      summary: 'Add a new transaction',
      tags: ['Transactions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number'
                },
                action: {
                  type: 'number'
                },
                currencyId: {
                  type: 'number'
                },
                userId: {
                  type: 'number'
                }
              },
              required: ['amount', 'action', 'currencyId', 'userId']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Transaction created successfully',
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
  '/transaction/{userId}': {
    get: { 
      summary: 'Get user balance by userId',
      tags: ['Transactions'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          description: 'ID of the user to retrieve balance',
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
                  totalDepositAmount: {
                    type: 'number'
                  },
                  totalWithdrawAmount: {
                    type: 'number'
                  },
                  balance: {
                    type: 'number'
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
                  error: {
                    type: 'string'
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
