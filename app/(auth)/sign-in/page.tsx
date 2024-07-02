import React from 'react'
import AuthForm from '@/components/AuthForm'
import { getLoggedInUser } from '@/lib/actions/user.actions';

const SignIn = () => {
  // const loggedInUser = await getLoggedInUser();

  // console.log(loggedInUser); 
  // this snippet was just to ensure that it works and sends data via URL
  return (
    <section className='flex-center size-full max-sm:px-6'>
      <AuthForm type="sign-in" />
    </section>
  )
}

export default SignIn
