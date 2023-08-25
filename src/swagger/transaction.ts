export default {
  '/transactions': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
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
                    items: {}
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
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Add a new transaction',
      tags: ['Transactions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                senderId: {
                  type: 'number'
                },
                receiverId: {
                  type: 'number'
                },
                gameId: {
                  type: 'string'
                },
                type: {
                  type: 'string'
                },
                note: {
                  type: 'string'
                },
                token: {
                  type: 'string'
                },
                status: {
                  type: 'string'
                },
                amount: {
                  type: 'number'
                },
                currencyId: {
                  type: 'number'
                },
                updatedBy: {
                  type: 'number'
                }
              },
              required: [
                'senderId',
                'receiverId',
                'gameId',
                'type',
                'amount',
                'currencyId'
              ]
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
  '/transaction-details/{userId}': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
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
