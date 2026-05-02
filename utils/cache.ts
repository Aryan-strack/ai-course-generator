import { TokenCache } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
          console.log(`${key} was used \n`);
        } else {
          console.log("No value found for key: " + key + "\n");
        }
        return item;
      } catch (error) {
        console.error("Error retrieving item from cache: ", error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: (key: string, value: string) => {
      return SecureStore.setItemAsync(key, value);
    },
  };
};

export const tokenCache =
  Platform.OS !== "web" ? createTokenCache() : undefined;
