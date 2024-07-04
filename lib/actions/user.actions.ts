'use server';

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorApexProcessorTokenCreateRequest, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env

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

export const signUp = async ({password, ...userData}: SignUpParams) => {
    const { email, firstName, lastName} = userData

    let newUserAccount;

    try{
        //Create a user account using Appwrite
        const { account, database } = await createAdminClient();

        newUserAccount = await account.create(
            ID.unique(), 
            email, 
            password, 
            `${firstName} ${lastName}`
        );

        if(!newUserAccount) throw new Error("Error creating user")

        const dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal'
        })

        if(!dwollaCustomerUrl) throw new Error("Error creationg Dwolla Customer")

        const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

        const newUser = await database.createDocument(
            DATABASE_ID!,
            USER_COLLECTION_ID!,
            ID.unique(),
            {
                ...userData,
                userId: newUserAccount.$id,
                dwollaCustomerId,
                dwollaCustomerUrl
            }
        )
        
        const session = await account.createEmailPasswordSession(email, password);

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify(newUser); //cannot pass large object through server actions in nextjs

    } catch (error) {
        console.log('Error', error);
    }
}

// ... your initilization functions

export async function getLoggedInUser() {
    try {
        const { account } = await createSessionClient();
        return await account.get(); //returns null instead of an user
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
                client_name: `${user.firstName} ${user.lastName}`,
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

export const createBankAccount = async ({
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    sharableId,
}: createBankAccountProps) => {
    try {
        const {database } = await createAdminClient();

        const bankAccount = await database.createDocument(
            DATABASE_ID!, 
            BANK_COLLECTION_ID!,
            ID.unique(),
            {
                userId,
                bankId,
                accountId,
                accessToken,
                fundingSourceUrl,
                sharableId,
            }
        )

        return parseStringify(bankAccount);

    } catch (error) {
        
    }
}


export const exchangePublicToken = async ({
    publicToken,
    user,
}: exchangePublicTokenProps) => {
    try {
        const response = await plaidClient.
        itemPublicTokenExchange({
            public_token: publicToken,
        });

        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // Get account info from Plaid using the access token
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken,
        });

        const accountData = accountsResponse.data.accounts[0];
        
        // Create a proccessor token for dwolla using the access token and account ID
        const request: ProcessorTokenCreateRequest = {
            access_token: accessToken,
            account_id: accountData.account_id,
            processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
        };

        const processorTokenResponse = await plaidClient.processorTokenCreate(request);
        const processorToken = processorTokenResponse.data.processor_token;

        //Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
        const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId: user.dwollaCustomerId,
            processorToken,
            bankName: accountData.name,
        });

        // If the funding source URL is not created, throw an error
        if(!fundingSourceUrl) throw Error;

        // Create a bank account using the user ID, item ID, accounnt ID, access token, funding source URL, and sharable ID
        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            sharableId: encryptId(accountData.account_id),
        }) 

        // Revalidate the path to request changes
        revalidatePath("/");

        return parseStringify({
            publicTokenExchange: "Complete",
        });


    } catch (error) {
        console.log("An error occured while creating exchanging token: ", error)
    }
}
