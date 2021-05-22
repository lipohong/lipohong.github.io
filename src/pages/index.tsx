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
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor.flare} rotation={0} zIndex={1} top={4} left={-3} />
            <OperationSign type={OperationSignType.addition} size={3} color={LinerColor['dark-ocean']} rotation={135} zIndex={2} top={4} left={1} />
            <OperationSign type={OperationSignType.subtraction} size={3} color={LinerColor.frozen} rotation={90} zIndex={3} top={0.5} left={-2} />
            <OperationSign type={OperationSignType.division} size={3} color={LinerColor['aqua-marine']} rotation={135} zIndex={4} top={0} left={1} />
          </section>
          <section className="operationSignGroup-2">
            <OperationSign type={OperationSignType.addition} size={8} color={LinerColor.frozen} rotation={0} zIndex={1} top={0} left={-5} />
            <OperationSign type={OperationSignType.addition} size={10} color={LinerColor.metapolis} rotation={0} zIndex={2} top={28} left={-35} />
            <OperationSign type={OperationSignType.addition} size={5} color={LinerColor.memariani} rotation={0} zIndex={3} top={8} left={-8} />
            <OperationSign type={OperationSignType.addition} size={8} color={LinerColor['piggy-pink']} rotation={45} zIndex={4} top={15} left={-12} />
            <OperationSign type={OperationSignType.addition} size={12} color={LinerColor['grade-grey']} rotation={135} zIndex={5} top={30} left={0} />
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor['rose-water']} rotation={135} zIndex={6} top={18} left={-22} />
            <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor.harvey} rotation={45} zIndex={7} top={16} left={15} />
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor['mango-pulp']} rotation={90} zIndex={8} top={20} left={2} />
            <OperationSign type={OperationSignType.division} size={10} color={LinerColor['j-shine']} rotation={135} zIndex={9} top={-2} left={10} />
            <OperationSign type={OperationSignType.division} size={12} color={LinerColor.neuromancer} rotation={135} zIndex={10} top={28} left={-18} />
            <OperationSign type={OperationSignType.division} size={15} color={LinerColor['dark-ocean']} rotation={90} zIndex={11} top={0} left={-30} />
          </section>
          <section className="operationSignGroup-3">
            <OperationSign type={OperationSignType.subtraction} size={10} color={LinerColor.amin} rotation={45} zIndex={1} top={0} left={50} />
            <OperationSign type={OperationSignType.subtraction} size={12} color={LinerColor.yoda} rotation={45} zIndex={1} top={0} left={60} />
            <OperationSign type={OperationSignType.subtraction} size={17} color={LinerColor.sunrise} rotation={45} zIndex={1} top={0} left={75} />
            <OperationSign type={OperationSignType.subtraction} size={20} color={LinerColor.frozen} rotation={-135} zIndex={1} top={12} left={48} />
            <OperationSign type={OperationSignType.subtraction} size={13} color={LinerColor['witching-hour']} rotation={45} zIndex={1} top={20} left={66} />
            <OperationSign type={OperationSignType.subtraction} size={15} color={LinerColor['moonlit-asteroid']} rotation={-135} zIndex={1} top={30} left={50} />
            <OperationSign type={OperationSignType.subtraction} size={21} color={LinerColor['bloody-mary']} rotation={-135} zIndex={1} top={28} left={70} />
          </section>
        </div>
      </section>
      <section className="secondSection">
        
      </section>
    </>
  )
}

export default HomePage;