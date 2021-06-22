import * as React from 'react';
import { useEffect, Suspense } from 'react';
import { Carousel } from 'react-bootstrap';
import theme1 from '../../assets/file/video/theme1.mp4';
import mode1 from '../../assets/file/video/mode1.mp4';
import multiLangual1 from '../../assets/file/video/multiLangual1.mp4';
import iblog1 from "../../assets/file/image/iblog1.png";
import iblog2 from "../../assets/file/image/iblog2.png";
import iblog3 from "../../assets/file/image/iblog3.png";

const iBlogPage: React.FunctionComponent = () => {
  useEffect(() => {
    if (window) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <Suspense fallback={<main className="lazyLoading">loading...</main>}>
      <main className="iBlogPage">
        <header className="header">
          <main>
            <header>iBlog</header>
          </main>
          <section className="imageContainer">
            <img src={iblog3} alt="iblog3" />
            <img src={iblog2} alt="iblog2" />
            <img src={iblog1} alt="iblog1" />
          </section>
        </header>
        <main className="content">
          <div className="container">
            <div className="title">Features</div>
            <Carousel id="firstCarousel" nextLabel="" prevLabel="" interval={10000}>
              <Carousel.Item>
                <video width="100%" autoPlay loop>
                  <source src={theme1} type="video/mp4" />
                </video>
                <Carousel.Caption>
                  <h3>Theme Switching</h3>
                  <p>Choosing whatever color you like depending on your mood.</p>
                </Carousel.Caption>
              </Carousel.Item>
              <Carousel.Item>
                <video width="100%" autoPlay loop>
                  <source src={mode1} type="video/mp4" />
                </video>
                <Carousel.Caption>
                  <h3>Mode Swithing</h3>
                  <p>Eyes friendly, support switching light and dark mode.</p>
                </Carousel.Caption>
              </Carousel.Item>
              <Carousel.Item>
                <video width="100%" autoPlay loop>
                  <source src={multiLangual1} type="video/mp4" />
                </video>
                <Carousel.Caption>
                  <h3>Multilingual</h3>
                  <p>Switching between English and traditional Chinese (and any language you want after configuration).</p>
                </Carousel.Caption>
              </Carousel.Item>
            </Carousel>
          </div>
        </main>
      </main>
    </Suspense>
  )
}

export default iBlogPage;