import * as React from 'react';
import { useEffect, Suspense }from 'react';
import { Link } from "react-router-dom";
import LinerColor from '../models/enum/linerColor';
const OperationSign = React.lazy(() => import('../components/operationSign'));
import OperationSignType from '../models/enum/operationSignType';


const threshold100 = 100;

const HomePage: React.FunctionComponent = () => {

  const handleEffect = () => {
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);  //get viewpoint height

    // animate
    const goToProfileButton = document.querySelector('#goToProfile');
    const goToProfileButtonRect = goToProfileButton.getBoundingClientRect();
    if (goToProfileButtonRect.top > vh) {
      goToProfileButton.classList.remove('show');
      goToProfileButton.classList.add('hide');
    } else if (goToProfileButtonRect.top < vh - threshold100) {
      goToProfileButton.classList.remove('hide');
      goToProfileButton.classList.add('show');
    }
    
    // paralax
    const operationSignGroup2 = document.getElementById('operationSignGroup2');
    const operationSignGroup3 = document.getElementById('operationSignGroup3');
    const operationSignGroup4= document.getElementById('operationSignGroup4');
    const firstSection = document.querySelector('#firstSection');
    const secondSection = document.querySelector('#secondSection');
    const firstSectionRect = firstSection.getBoundingClientRect();
    const secondSectionRect = secondSection.getBoundingClientRect();
    operationSignGroup2.style.top = String(`${firstSectionRect.top * 0.2}px`);
    operationSignGroup3.style.top = String(`${firstSectionRect.top * 0.3}px`);
    operationSignGroup4.style.top = String(`${secondSectionRect.top * 0.3}px`);
  }
  useEffect(() => {
    if (!!window && 'IntersectionObserver' in window) {
      window.addEventListener('load', handleEffect);
      window.addEventListener('scroll', handleEffect);
    }
    return () => {
      window.removeEventListener('load', handleEffect);
      window.removeEventListener('scroll', handleEffect);
    }
  }, []);

  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="home">
        <section id="firstSection" className="firstSection">
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
            <section id="operationSignGroup1" className="operationSignGroup-1">
              <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.flare} rotation={0} zIndex={1} top={4} left={-3} />
              <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.darkOcean} rotation={135} zIndex={2} top={4} left={1} />
              <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.frozen} rotation={90} zIndex={3} top={0.5} left={-2} />
              <OperationSign type={OperationSignType.division} size={3} color={LinerColor.aquaMarine} rotation={135} zIndex={4} top={0} left={1} />
            </section>
            <section id="operationSignGroup2" className="operationSignGroup-2">
              <OperationSign type={OperationSignType.addition} size={8} color={LinerColor.frozen} rotation={0} zIndex={1} top={-5} left={-5} />
              <OperationSign type={OperationSignType.addition} size={13} color={LinerColor.eveningSunshine} rotation={0} zIndex={1} top={12} left={-43} />
              <OperationSign type={OperationSignType.addition} size={10} color={LinerColor.metapolis} rotation={45} zIndex={2} top={32} left={-35} />
              <OperationSign type={OperationSignType.addition} size={5} color={LinerColor.memariani} rotation={0} zIndex={3} top={8} left={-12} />
              <OperationSign type={OperationSignType.addition} size={8} color={LinerColor.piggyPink} rotation={45} zIndex={4} top={15} left={-12} />
              <OperationSign type={OperationSignType.addition} size={12} color={LinerColor.gradeGrey} rotation={135} zIndex={5} top={30} left={0} />
              <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.roseWater} rotation={135} zIndex={6} top={22} left={-22} />
              <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor.harvey} rotation={45} zIndex={7} top={16} left={15} />
              <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.mangoPulp} rotation={90} zIndex={8} top={20} left={-2} />
              <OperationSign type={OperationSignType.division} size={10} color={LinerColor.jShine} rotation={135} zIndex={9} top={-5} left={10} />
              <OperationSign type={OperationSignType.division} size={12} color={LinerColor.neuromancer} rotation={135} zIndex={10} top={37} left={-18} />
              <OperationSign type={OperationSignType.division} size={15} color={LinerColor.darkOcean} rotation={90} zIndex={11} top={-5} left={-32} />
            </section>
            <section id="operationSignGroup3" className="operationSignGroup-3">
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
        <section id="secondSection" className="secondSection">
          <main>
            <header>Profile</header>
            <p>Introduction of Stan!</p>
            <Link to='/profile'>
              <div id="goToProfile" className="goToProfileButton">GO</div>
            </Link>
          </main>
          <section id="operationSignGroup4" className="operationSignGroup-4">
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.coolSky} rotation={90} zIndex={1} top={0} left={1.5} />
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.witchingHour} rotation={45} zIndex={2} top={1} left={5} />
            <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.bloodyMary} rotation={90} zIndex={3} top={3.5} left={4.5} />
            <OperationSign type={OperationSignType.division} size={3} color={LinerColor.moonlitAsteroid} rotation={135} zIndex={4} top={2.5} left={-0.5} />
          </section>
        </section>
      </main>
    </Suspense>
  )
}

export default HomePage;