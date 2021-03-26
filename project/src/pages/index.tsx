import * as React from 'react';
import { Link } from "react-router-dom";

const HomePage: React.FunctionComponent = () => {

    return (
        <div className="home">
            <header><h3>Parallax Templates!</h3></header>
            <ul>
                <li>
                    <Link to="/playground/ParallaxTemplate1">
                        Parallax Template1
                    </Link>
                </li>
                <li>
                    <Link to="/playground/ParallaxTemplate2">
                        Parallax Template2
                    </Link>
                </li>
            </ul>
        </div>
    )
}

export default HomePage;