import React from 'react'
import Header from './Header'
import Body from './Body'

function Profile() {
  return (
    <div>
      <Header />
      <div className='w-full max-h-screen overflow-y-auto'>

      <Body />
      </div>
    </div>
  )
}

export default Profile
