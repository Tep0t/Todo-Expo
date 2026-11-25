import 'react-native-url-polyfill/auto';

import Constants from 'expo-constants';
import {
  Account,
  AppwriteException,
  Client,
  ID,
  Permission,
  Query,
  Role,
  TablesDB,
} from 'react-native-appwrite';
import { Platform } from 'react-native';

export { AppwriteException, ID, Permission, Query, Role };

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error('Appwrite environment variables are missing.');
}

const platform = Platform.select({
  android: Constants.expoConfig?.android?.package,
  ios: Constants.expoConfig?.ios?.bundleIdentifier,
});

if (!platform) {
  throw new Error(`The Appwrite platform identifier is missing for ${Platform.OS}.`);
}

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform(platform);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
export const TABLE_ID = process.env.EXPO_PUBLIC_APPWRITE_TABLE_ID!;
