import * as React from 'react';
import { Link } from "react-router-dom";
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin, mdiPhone, mdiEmail } from '@mdi/js';

const Foot: React.FunctionComponent = () => {

  return (
    <footer className="foot">
      <div className="upperContainer">
        <header>
          <main>
            Make <span>Excellent</span> Website and App
          </main>
          <footer>
            iWebsite<sup>©</sup> 2021 by Stan Li
          </footer>
        </header>
        <main>
          <header>CONTACT INFO</header>
          <main>
            <section><Icon path={mdiPhone} size={1} /> +852 9048 3591</section>
            <section><Icon path={mdiEmail} size={1} /> lipohong@hotmail.com</section>
          </main>
        </main>
      </div>
      <footer>
        <section>
          <Link to='/profile'>About me</Link>
        </section>
        <section>
          <a href="https://github.com/lipohong/lipohong.github.io">
            <Icon path={mdiGithub} size={1} />
          </a>
          <a href="https://www.linkedin.com/in/stan-li-245a5b182">
            <Icon path={mdiLinkedin} size={1} />
          </a>
        </section>
      </footer>
    </footer>
  )
}

export default Foot;