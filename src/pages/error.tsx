import * as React from 'react';
import { useState, useEffect, Suspense }from 'react';
import { useHistory, Link } from "react-router-dom";

const ErrorPage: React.FunctionComponent = () => {
  const [seconds, setSeconds] = useState<number>(5);
  const history = useHistory();

  const countDown = () => {
    const interval = setInterval(() => {
      let s = 0;
      setSeconds(seconds => {
        s = seconds - 1;
        return seconds - 1;
      });
      if (s < 0) {
        clearInterval(interval);
        history.push("/");
      }
    }, 1000);
  }

  useEffect(() => {
    countDown();
  }, []);

  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="errorPage">
        <div>
          <header>404</header>
          <main>Page Not Found</main>
          <footer>Auto nevigate to <Link to="/"> home page </Link> in <span>{seconds}</span> seconds</footer>
        </div>
      </main>
    </Suspense>
  )
}

export default ErrorPage;