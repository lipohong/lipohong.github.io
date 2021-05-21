import * as React from 'react';
import LinerColor from '../models/enum/linerColor';
import OperationSign from '../components/operationSign';
import OperationSignType from '../models/enum/operationSignType';

const HomePage: React.FunctionComponent = () => {

  return (
    <>
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
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.flare} rotation={0} zIndex={4} top={8} left={4} />
            <OperationSign type={OperationSignType.addition} size={4} color={LinerColor['dark-ocean']} rotation={135} zIndex={5} top={4} left={2} />
            <OperationSign type={OperationSignType.subtraction} size={4} color={LinerColor.frozen} rotation={90} zIndex={6} top={11} left={4} />
            <OperationSign type={OperationSignType.division} size={5} color={LinerColor['aqua-marine']} rotation={135} zIndex={7} top={4.5} left={8} />
          </section>
          <section className="operationSignGroup-2">
            <OperationSign type={OperationSignType.addition} size={8} color={LinerColor.frozen} rotation={0} zIndex={2} top={8} left={47} />
            <OperationSign type={OperationSignType.addition} size={5} color={LinerColor.memariani} rotation={0} zIndex={3} top={28} left={58} />
            <OperationSign type={OperationSignType.addition} size={8} color={LinerColor['piggy-pink']} rotation={45} zIndex={4} top={28} left={65} />
            <OperationSign type={OperationSignType.addition} size={12} color={LinerColor['grade-grey']} rotation={135} zIndex={5} top={0} left={60} />
            <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor.harvey} rotation={45} zIndex={6} top={18} left={47} />
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor['mango-pulp']} rotation={90} zIndex={6} top={34} left={68} />
            <OperationSign type={OperationSignType.division} size={10} color={LinerColor['j-shine']} rotation={135} zIndex={7} top={16} left={60} />
            <OperationSign type={OperationSignType.division} size={12} color={LinerColor.neuromancer} rotation={135} zIndex={8} top={32} left={46} />
          </section>
        </div>
      </section>
      <section className="secondSection">
        
      </section>
    </>
  )
}

export default HomePage;