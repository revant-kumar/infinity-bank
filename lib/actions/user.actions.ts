'use server';

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";
import { CountryCode, Products } from "plaid";
import { plaidClient } from "../plaid";

export const signIn = async ({ email, password }: signInProps) => {
    try{
        //Mutation / Database / Make fetch
        //In sign-up we extracted an account from createAdminClient
        //Here we try to create a session using email and password
        const { account } = await createAdminClient();
        const response = await account.createEmailPasswordSession(email, password);

        return parseStringify(response);
        
    } catch (error) {
        console.log('Error', error);
    }
}

export const signUp = async (userData: SignUpParams) => {
    const { email, password, firstName, lastName} = userData
    try{
        //Create a user account using Appwrite
        const { account } = await createAdminClient();

        const newUserAccount = await account.create(
            ID.unique(), 
            userData.email, 
            userData.password, 
            `${firstName} ${lastName}`);
        
            const session = await account.createEmailPasswordSession(email, password);

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify(newUserAccount); //cannot pass large object through server actions in nextjs

    } catch (error) {
        console.log('Error', error);
    }
}

// ... your initilization functions

export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
    //   return await account.get(); //returns null instead of an user
        const user = await account.get();
        return parseStringify(user);
    } catch (error) {
      return null;
    }
}

export const logoutAccount = async () => {
    try{
        const { account } = await createSessionClient();

        cookies().delete('appwrite-session');

        await account.deleteSession('current');
        
    } catch(error){
        return null;
    }
}

export const createLinkToken = async (user: User) => {
    try{
        const tokenParams = {
            user: {
                client_user_id: user.$id
            },
            client_name: user.name,
            products: ['auth'] as Products[],
            language: 'en',
            country_codes: ['US'] as CountryCode[],
        }

        const response = await plaidClient.linkTokenCreate(tokenParams);
        return parseStringify({ linkToken: response.data.link_token })
        //Plaid link is coming from plaid plaid.tsx

    } catch (error) {
        console.log(error);
    }
}
  
// Exchange public token fn exchanges our access token for a token which allows us to do banking stuff
// 1. Create a plaid token
// 2. Pass generated link token to plaid link
// 3. Trigger flow of connecting bank account to application through plaid link
// 4. On success, plaid link will provide temporary public token
// 5. Exchange public token with permanent access token
// 6. Exchange access token to get bank account information
// 7. Processor

export const exchangePublicToken = async ({
    publicToken,
    user,
}: exchangePublicTokenProps) => {
    try {
        
    } catch (error) {
        
    }
}
