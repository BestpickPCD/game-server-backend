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
      parameters: [
        {
          name: 'type',
          in: 'path',
          description:
            'bet | win | cancel | deposit | withdraw | user.add_balance ',
          type: 'string'
        },
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          required: false,
          type: 'number',
          default: 0
        },
        {
          name: 'size',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          type: 'number',
          default: 10
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
      summary: 'Add a new transaction for transfer method',
      tags: ['Transactions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string'
                },
                type: {
                  type: 'string'
                },
                amount: {
                  type: 'number'
                },
                currencyCode: {
                  type: 'number'
                }
              },
              required: ['userId', 'type', 'amount', 'currencyCode']
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
  '/callback/changeBalance': {
    post: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Add a new transaction for callback',
      tags: ['Transactions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string'
                },
                type: {
                  type: 'string'
                },
                amount: {
                  type: 'number'
                },
                currencyCode: {
                  type: 'number'
                }
              },
              required: ['userId', 'type', 'amount', 'currencyCode']
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
            type: 'string'
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
  },
  '/transaction-details/{id}': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Get transaction detail by transaction id',
      tags: ['Transactions'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID of the transaction',
          required: true,
          schema: {
            type: 'string',
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
                properties: {}
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
