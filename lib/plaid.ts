import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID' : process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET' : process.env.PLAID_SECRET
        }
    }
})

export const plaidClient = new PlaidApi(configuration);

// Basic idea of appwrite and plaid
// Create a client -> expose it the app -> use that client to do things