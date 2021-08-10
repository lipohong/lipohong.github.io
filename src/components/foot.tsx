import * as React from 'react';
import { Link } from "react-router-dom";
import Icon from '@mdi/react';
import { mdiGithub, mdiLinkedin, mdiPhone, mdiEmail } from '@mdi/js';

const Foot: React.FunctionComponent = () => {

  return (
    <footer className="foot">
      <header className="header">
        Make <span>Excellent</span> Website and App
      </header>
      <main className="contactInfo">
        <header>CONTACT INFO</header>
        <main>
          <section><Icon path={mdiPhone} size={1} /> +12 1234 5789</section>
          <section><Icon path={mdiEmail} size={1} /> xxxxxxxx@xxx.com</section>
        </main>
      </main>
      <section className="copyRightInfo">iWebsite<sup>©</sup> 2021 by Stan Li</section>
      <section className="aboutMe">
        <Link to='/profile'>About me</Link>
      </section>
      <section className="socialLink">
        <a href="https://github.com/lipohong/lipohong.github.io">
          <Icon path={mdiGithub} size={1} />
        </a>
        <a href="https://www.linkedin.com/in/stan-li-245a5b182">
          <Icon path={mdiLinkedin} size={1} />
        </a>
      </section>
    </footer>
  )
}

export default Foot;