import mongoose, { Connection } from 'mongoose';

export const connect = async (): Promise<Connection> => {
  try {
    await mongoose.connect(`${process.env.DATABASE_TRANSACTION}`);
    console.log(
      `Successfully connected to the Mongo transaction database -> ${process.env.DATABASE_TRANSACTION}`
    );

    return mongoose.connection; // Return the connection object
  } catch (error) {
    console.log('Database connection failed. Exiting now...');
    console.error(error);
    process.exit(1);
  }
};
