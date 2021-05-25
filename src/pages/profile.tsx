import * as React from 'react';
import { Suspense }from 'react';

const ProfilePage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="profile">
      </main>
    </Suspense>
  )
}

export default ProfilePage;