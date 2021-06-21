import * as React from 'react';
import { useEffect, Suspense }from 'react';

const iWebsitePage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="iwebsitePage"></main>
    </Suspense>
  )
}

export default iWebsitePage;