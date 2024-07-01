"use server";

import { Databases, Client, Account, Users } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) //Sending the endpoint for appwrite to understand which project to modify
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const session = cookies().get("appwrite-session"); //Every time we create a session it validates it 
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value); //attaching session to client

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() { //will have permissions to do anything --- keep it secure
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get database() {
        return new Databases(client);
    },
    get user() {
        return new Users(client);
    }
  };
}


