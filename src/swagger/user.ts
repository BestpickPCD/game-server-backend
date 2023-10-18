export default {
  '/login': {
    post: {
      summary: 'Login',
      tags: ['AUTH'],
      requestBody: {
        description: 'User data to be created',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  default: 'user.master.1'
                },
                password: {
                  type: 'string',
                  default: 'user.master.1'
                }
              },
              required: ['username', 'password']
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
                  token: {
                    type: 'string'
                  },
                  refreshToken: {
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
  '/register': {
    post: {
      summary: 'Register',
      tags: ['AUTH'],
      requestBody: {
        description: 'User data to be created',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                firstName: {
                  type: 'string'
                },
                lastName: {
                  type: 'string'
                },
                username: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                },
                password: {
                  type: 'string'
                },
                confirmPassword: {
                  type: 'string'
                },
                type: {
                  type: 'string'
                },
                agentId: {
                  type: 'number'
                },
                roleId: {
                  type: 'number'
                },
                parentAgentId: {
                  type: 'number'
                }
              },
              required: [
                'firstName',
                'lastName',
                'username',
                'email',
                'password',
                'confirmPassword',
                'type',
                'agentId',
                'roleId',
                'parentAgentId'
              ]
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
                  userId: {
                    type: 'number'
                  },
                  username: {
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
  '/users': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Get users based on query parameters',
      tags: ['Users'],
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
        '500': {
          description: 'Internal server error'
        }
      }
    }
  },
  '/user/{userId}': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Get user detail by userId',
      tags: ['Users'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          description: 'ID of the user to retrieve',
          required: true,
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
      summary: 'Update user by userId',
      tags: ['Users'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          description: 'ID of the user to retrieve',
          required: true,
          type: 'string'
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
                email: {
                  type: 'string'
                },
                roleId: {
                  type: 'number'
                },
                currencyId: {
                  type: 'number'
                },
                agentId: {
                  type: 'number'
                },
                parentAgentId: {
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
    },
     // james for password added
     patch: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Update user by userId',
      tags: ['Users'],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          description: 'ID of the user to retrieve',
          required: true,
          type: 'string'
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
                  password: 'string'
                },
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
    },
    delete: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Delete user by userId',
      tags: ['Users'],
      parameters: [
        {
          name: 'userId',
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
    }
  },
  '/permissions': {
    get: {
      security: [
        {
          bearerAuth: []
        }
      ],
      summary: 'Permissions',
      tags: ['Permissions'],
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
        }
      }
    }
  }
};
