import {
  Account,
  AppwriteException,
  Client,
  ID,
  Permission,
  Query,
  Role,
  TablesDB,
} from 'appwrite';

export { AppwriteException, ID, Permission, Query, Role };

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error('Appwrite environment variables are missing.');
}

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
export const TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!;
