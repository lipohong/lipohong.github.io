import * as React from 'react';
import { Link } from "react-router-dom";
import { useSpring, animated } from 'react-spring';

const calc = (x: number, y: number) => [-(y - window.innerHeight / 2) / 20, (x - window.innerWidth / 2) / 20, 1.1]
const trans = (x?: number, y?: number, s?: number) => `perspective(600px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`


const HomePage: React.FunctionComponent = () => {
  const [props, set] = useSpring(() => ({ xys: [0, 0, 1], config: { mass: 5, tension: 350, friction: 40 } }));

  return (
    <Link to="/playground/parallax" className="home">
      <animated.div
        className="card"
        onMouseMove={({ clientX: x, clientY: y }) => set({ xys: calc(x, y) })}
        onMouseLeave={() => set({ xys: [0, 0, 1] })}
        style={{ transform: props.xys.interpolate(trans) }}
      >
        Play with parallax!
      </animated.div>
    </Link>
  )
}

export default HomePage;