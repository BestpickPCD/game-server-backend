import { Response } from 'express';
import { response } from './response/index.ts';

class SuccessResponse {
  statusCode: number;
  subMessage?: string;
  message?: string;
  data: any;

  constructor({
    message,
    statusCode,
    subMessage,
    data
  }: {
    message?: string;
    statusCode: number;
    subMessage?: string;
    data?: any;
  }) {
    this.statusCode = statusCode;
    this.subMessage = subMessage;
    this.message = message;
    this.data = data;
  }

  send(res: Response) {
    return res.status(this.statusCode).json(this);
  }
}

class OK extends SuccessResponse {
  constructor({ message, data }: { message?: string; data?: any }) {
    super({
      data,
      message: message || 'OK',
      subMessage: response.message.OK,
      statusCode: response.code.OK
    });
  }
}

class CREATED extends SuccessResponse {
  constructor({ message, data }: { message?: string; data?: any }) {
    super({
      data,
      message: message || 'OK',
      subMessage: response.message.CREATED,
      statusCode: response.code.CREATED
    });
  }
}

class UPDATED extends SuccessResponse {
  constructor({ message, data }: { message?: string; data?: any }) {
    super({
      data,
      message: message || 'OK',
      subMessage: response.message.UPDATED,
      statusCode: response.code.OK
    });
  }
}

class DELETED extends SuccessResponse {
  constructor({ message, data }: { message?: string; data?: any }) {
    super({
      data,
      message: message || 'OK',
      subMessage: response.message.DELETED,
      statusCode: response.code.OK
    });
  }
}

export { CREATED, DELETED, OK, UPDATED };
