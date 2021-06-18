import * as React from 'react';
import { useEffect, Suspense }from 'react';
import { Link } from "react-router-dom";
import LinerColor from '../models/enum/linerColor';
const OperationSign = React.lazy(() => import('../components/operationSign'));
import OperationSignType from '../models/enum/operationSignType';
import project1 from "../assets/file/image/iwebsite-project1.png";
import profile1 from "../assets/file/image/iwebsite-profile1.png";


const threshold50 = 50;

const HomePage: React.FunctionComponent = () => {

  const handleEffect = () => {
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);  //get viewpoint height

    // animate
    const animationElementList = document.querySelectorAll('.showAndHideAnimation');
    animationElementList.forEach(animationElement => {
      const rect = animationElement.getBoundingClientRect();
      if (rect.top < vh - threshold50 && !animationElement.classList.contains('show')) {
        animationElement.classList.add('show');
      } else if (rect.top > vh && !!animationElement.classList.contains('show')) {
        animationElement.classList.remove('show');
      }
    });
    
    // paralax
    const operationSignGroup2 = document.getElementById('operationSignGroup2');
    const operationSignGroup3 = document.getElementById('operationSignGroup3');
    const operationSignGroup4= document.getElementById('operationSignGroup4');
    const operationSignGroup5= document.getElementById('operationSignGroup5');
    const firstSection = document.querySelector('#firstSection');
    const secondSection = document.querySelector('#secondSection');
    const thirdSection = document.querySelector('#thirdSection');
    const firstSectionRect = firstSection.getBoundingClientRect();
    const secondSectionRect = secondSection.getBoundingClientRect();
    const thirdSectionRect = thirdSection.getBoundingClientRect();
    operationSignGroup2.style.top = String(`${firstSectionRect.top * 0.1}px`);
    operationSignGroup3.style.top = String(`${firstSectionRect.top * 0.1}px`);
    operationSignGroup4.style.top = String(`${secondSectionRect.top * 0.2}px`);    
    operationSignGroup5.style.top = String(`${200 - thirdSectionRect.top * 0.2}px`);    
  }

  useEffect(() => {
    if (window) {
      window.scrollTo(0, 0);
    }
    if (!!window && 'IntersectionObserver' in window) {
      handleEffect();
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
                <h2>A Site For Showcasing My Profile And Projects</h2>
                <p>HTML | css | JavaScript | webpack | React.js | Node.js</p>
                <p>Github Pages, Single Page Applications, Responsive, Parallax</p>
              </main>
            </section>
            <div className="backgroundCover"></div>
            <div id="operationSignGroup1" className="operationSignGroup-1">
              <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.flare} rotation={0} zIndex={1} top={4} left={-3} />
              <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.darkOcean} rotation={135} zIndex={2} top={4} left={1} />
              <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.frozen} rotation={90} zIndex={3} top={0.5} left={-2} />
              <OperationSign type={OperationSignType.division} size={3} color={LinerColor.aquaMarine} rotation={135} zIndex={4} top={0} left={1} />
            </div>
            <div id="operationSignGroup2" className="operationSignGroup-2">
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
            </div>
            <div id="operationSignGroup3" className="operationSignGroup-3">
              <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.amin} rotation={45} zIndex={1} top={-5} left={50} />
              <OperationSign type={OperationSignType.subtraction} size={12} color={LinerColor.yoda} rotation={45} zIndex={1} top={-5} left={65} />
              <OperationSign type={OperationSignType.subtraction} size={17} color={LinerColor.sunrise} rotation={45} zIndex={1} top={0} left={75} />
              <OperationSign type={OperationSignType.subtraction} size={20} color={LinerColor.frozen} rotation={-135} zIndex={1} top={12} left={48} />
              <OperationSign type={OperationSignType.subtraction} size={13} color={LinerColor.witchingHour} rotation={45} zIndex={1} top={20} left={66} />
              <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor.moonlitAsteroid} rotation={-135} zIndex={1} top={30} left={50} />
              <OperationSign type={OperationSignType.subtraction} size={21} color={LinerColor.bloodyMary} rotation={-135} zIndex={1} top={30} left={70} />
            </div>
          </div>
        </section>
        <section id="secondSection" className="secondSection">
          <main>
            <header>Projects Page</header>
            <p>Showcase for all projects I created.</p>
            <Link to='/projects'>
              <div id="goToProjectButton" className="homeButton goToProjectButton showAndHideAnimation leftToRightAnimation">GO</div>
            </Link>
          </main>
          <div className="imageContainer showAndHideAnimation shrinkToNormalAnimation">
            <img src={project1} alt="project1" />
          </div>
          <div className="backgroundCover"></div>
          <div id="operationSignGroup4" className="operationSignGroup-4">
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.coolSky} rotation={90} zIndex={1} top={0} left={1.5} />
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.witchingHour} rotation={45} zIndex={2} top={1} left={5} />
            <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.bloodyMary} rotation={90} zIndex={3} top={3.5} left={4.5} />
            <OperationSign type={OperationSignType.division} size={3} color={LinerColor.moonlitAsteroid} rotation={135} zIndex={4} top={2.5} left={-0.5} />
          </div>
        </section>
        <section id="thirdSection" className="thirdSection">
          <div className="imageContainer showAndHideAnimation shrinkToNormalAnimation">
            <img src={profile1} alt="profile1" />
          </div>
          <main>
            <header>Profile Page</header>
            <p>A page introducing me.</p>
            <Link to='/profile'>
              <div id="goToProjectButton" className="homeButton goToProfileButton showAndHideAnimation rightToLeftAnimation">GO</div>
            </Link>
          </main>
          <div id="operationSignGroup5" className="operationSignGroup-5">
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.piggyPink} rotation={90} zIndex={1} top={0} left={1.5} />
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.lawrencium} rotation={45} zIndex={2} top={1} left={5} />
            <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.megaTron} rotation={90} zIndex={3} top={3.5} left={4.5} />
            <OperationSign type={OperationSignType.division} size={3} color={LinerColor.coolBlues} rotation={135} zIndex={4} top={2.5} left={-0.5} />
          </div>
        </section>
      </main>
    </Suspense>
  )
}

export default HomePage;