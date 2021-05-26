import * as React from 'react';
import { Suspense }from 'react';

const KnowledgePage: React.FunctionComponent = () => {
  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="knowledge">
      </main>
    </Suspense>
  )
}

export default KnowledgePage;