import * as React from 'react';
import LinerColor from '../models/enum/linerColor';
import OperationSign from '../components/operationSign';
import OperationSignType from '../models/enum/operationSignType';

const HomePage: React.FunctionComponent = () => {

  return (
    <>
      <section className="firstSection">
        <div className="container">
          <section className="backgroundCover"></section>
          
          <section className="mainCover">
            <header>iWebsite</header>
            <main>
              <h2>A site For Showcasing My Projects</h2>
              <p>Profile | Projects | SPA | Demos | Knowledge</p>
            </main>
          </section>
          <section className="operationSignGroup-1">
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor['bloody-mary']} rotation={0} zIndex={4} top={5} left={5} />
            <OperationSign type={OperationSignType.addition} size={4} color={LinerColor['dark-ocean']} rotation={45} zIndex={5} top={5} left={2} />
            <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.frozen} rotation={90} zIndex={6} top={8} left={3} />
            <OperationSign type={OperationSignType.division} size={5} color={LinerColor['aqua-marine']} rotation={135} zIndex={7} top={3} left={8} />
          </section>
        </div>
      </section>
      <section className="secondSection">
        
      </section>
    </>
  )
}

export default HomePage;