import * as React from 'react';
import { useEffect, Suspense }from 'react';
import LinerColor from '../models/enum/linerColor';
const OperationSign = React.lazy(() => import('../components/operationSign'));
import OperationSignType from '../models/enum/operationSignType';


const threshold = 100;

const HomePage: React.FunctionComponent = () => {
  const handleScrollAndResize = () => {
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);  //get viewpoint height
    const goToProfileButton = document.querySelector('#goToProfile');
    const goToProfileButtonRect = goToProfileButton.getBoundingClientRect();    
    if (goToProfileButtonRect.top > vh) {
      goToProfileButton.classList.remove('show');
      goToProfileButton.classList.add('hide');
    } else if (goToProfileButtonRect.top < vh - threshold) {
      goToProfileButton.classList.remove('hide');
      goToProfileButton.classList.add('show');
    }        
  }
  useEffect(() => {
    if (!!window && 'IntersectionObserver' in window) {
      window.addEventListener('scroll', handleScrollAndResize);
    }
    return () => {
      window.removeEventListener('scroll', handleScrollAndResize);
    }
  }, []);

  return (
    <Suspense fallback={<div>loading...</div>}>
      <section className="firstSection">
        <div className="container">
          <section className="mainCover">
            <header>iWebsite</header>
            <main>
              <h2>A site For Showcasing My Projects</h2>
              <p>HTML | css | JavaScript | webpack | reactjs | nodejs</p>
              <p>Github Pages, Single Page Applications, Responsive, Parallax</p>
            </main>
          </section>
          <section className="backgroundCover"></section>
          <section className="operationSignGroup-1">
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.flare} rotation={0} zIndex={1} top={4} left={-3} />
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.darkOcean} rotation={135} zIndex={2} top={4} left={1} />
            <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.frozen} rotation={90} zIndex={3} top={0.5} left={-2} />
            <OperationSign type={OperationSignType.division} size={3} color={LinerColor.aquaMarine} rotation={135} zIndex={4} top={0} left={1} />
          </section>
          <section className="operationSignGroup-2">
            <OperationSign type={OperationSignType.addition} size={8} color={LinerColor.frozen} rotation={0} zIndex={1} top={0} left={-5} />
            <OperationSign type={OperationSignType.addition} size={13} color={LinerColor.eveningSunshine} rotation={0} zIndex={1} top={12} left={-43} />
            <OperationSign type={OperationSignType.addition} size={10} color={LinerColor.metapolis} rotation={45} zIndex={2} top={28} left={-35} />
            <OperationSign type={OperationSignType.addition} size={5} color={LinerColor.memariani} rotation={0} zIndex={3} top={8} left={-12} />
            <OperationSign type={OperationSignType.addition} size={8} color={LinerColor.piggyPink} rotation={45} zIndex={4} top={15} left={-12} />
            <OperationSign type={OperationSignType.addition} size={12} color={LinerColor.gradeGrey} rotation={135} zIndex={5} top={30} left={0} />
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.roseWater} rotation={135} zIndex={6} top={18} left={-22} />
            <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor.harvey} rotation={45} zIndex={7} top={16} left={15} />
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.mangoPulp} rotation={90} zIndex={8} top={20} left={-2} />
            <OperationSign type={OperationSignType.division} size={10} color={LinerColor.jShine} rotation={135} zIndex={9} top={-5} left={10} />
            <OperationSign type={OperationSignType.division} size={12} color={LinerColor.neuromancer} rotation={135} zIndex={10} top={35} left={-18} />
            <OperationSign type={OperationSignType.division} size={15} color={LinerColor.darkOcean} rotation={90} zIndex={11} top={-5} left={-32} />
          </section>
          <section className="operationSignGroup-3">
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.amin} rotation={45} zIndex={1} top={-5} left={50} />
            <OperationSign type={OperationSignType.subtraction} size={12} color={LinerColor.yoda} rotation={45} zIndex={1} top={-5} left={65} />
            <OperationSign type={OperationSignType.subtraction} size={17} color={LinerColor.sunrise} rotation={45} zIndex={1} top={0} left={75} />
            <OperationSign type={OperationSignType.subtraction} size={20} color={LinerColor.frozen} rotation={-135} zIndex={1} top={12} left={48} />
            <OperationSign type={OperationSignType.subtraction} size={13} color={LinerColor.witchingHour} rotation={45} zIndex={1} top={20} left={66} />
            <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor.moonlitAsteroid} rotation={-135} zIndex={1} top={30} left={50} />
            <OperationSign type={OperationSignType.subtraction} size={21} color={LinerColor.bloodyMary} rotation={-135} zIndex={1} top={30} left={70} />
          </section>
        </div>
      </section>
      <section className="secondSection">
        <main>
          <header>Profile</header>
          <p>Introduction of Stan!</p>
          <div id="goToProfile" className="goToProfileButton">GO</div>
        </main>
        <section className="operationSignGroup-4">
          <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.coolSky} rotation={90} zIndex={1} top={0} left={1.5} />
          <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.witchingHour} rotation={45} zIndex={2} top={1} left={5} />
          <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.bloodyMary} rotation={90} zIndex={3} top={4} left={4.5} />
          <OperationSign type={OperationSignType.division} size={3} color={LinerColor.moonlitAsteroid} rotation={135} zIndex={4} top={3} left={0} />
        </section>
      </section>
    </Suspense>
  )
}

export default HomePage;