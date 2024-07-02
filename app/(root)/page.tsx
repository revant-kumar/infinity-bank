import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox' 
import RightSidebar from '@/components/RightSidebar'
import React from 'react'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const Home = async () => {
  const loggedIn = await getLoggedInUser();
  return (
    <section className="home">
      <div className="home-content">
        <header className='home-header'>
            <HeaderBox
              type="greeting"
              title="Welcome"
              user={loggedIn?.name || 'Guest'}
              subtext="Access and manager your account and transactions efficiently."
            />

            <TotalBalanceBox 
              accounts={[]}
              totalBanks = {1}
              totalCurrentBalance = {1250}
            />
        </header>
        </div>
        
        <RightSidebar 
        user = {loggedIn}
        transactions={[]}
        banks={[{ currentBalance: 12350},{ currentBalance: 50000}]}
        />
    </section>
  )
}

export default Home
