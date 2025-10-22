import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

export const storage = {
  setItem: async (key, value) => {
    return isWeb ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value);
  },
  getItem: async (key) => {
    return isWeb ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  deleteItem: async (key) => {
    return isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key);
  },
};