import { PrismaClient as Client1 } from '../../config/prisma/generated/base-default/index.js';
import { PrismaClient as Client2 } from '../../config/prisma/generated/transactions/index.js';
const prismaMysql = new Client1();
const prismaMongoDb = new Client2();

class Connection {
  database: any;
  constructor(database: any) {
    this.database = database;
  }
  connect(databaseName: string) {
    this.database
      .$connect()
      .then(() => {
        console.log(`Connected to prisma ${databaseName} database`);
      })
      .catch((error: any) => {
        console.error(
          `Error connected to prisma ${databaseName} database`,
          error
        );
      });
  }
}

const mysqlConnection = new Connection(prismaMysql).connect('mysql');
const mongodbConnection = new Connection(prismaMongoDb).connect('mongodb');

export { mysqlConnection, mongodbConnection };
