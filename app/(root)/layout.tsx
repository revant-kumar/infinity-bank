import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import Image from 'next/image';
import { useRouter } from "next/router";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();
  
  if(!loggedIn) redirect('/sign-in'); // we use this in place of router because router is a client component and none of its parents are 

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={loggedIn} />

      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo"/>
          <div>
          <MobileNav user={loggedIn}/>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
