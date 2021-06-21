import * as React from 'react';
import { useEffect, Suspense }from 'react';

const iBlogPage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="iblogPage"></main>
    </Suspense>
  )
}

export default iBlogPage;