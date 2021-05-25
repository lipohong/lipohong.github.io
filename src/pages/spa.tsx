import * as React from 'react';
import { Suspense }from 'react';

const SpaPage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="spa">
      </main>
    </Suspense>
  )
}

export default SpaPage;