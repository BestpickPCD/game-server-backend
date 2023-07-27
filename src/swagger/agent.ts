export default {
  '/agents/{id}/users': {
    get: {
      summary: 'Agent users',
      tags: ['Agents'],
      parameters: [
        {
          name: 'id',
          in: 'path',
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
                properties: { }
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
