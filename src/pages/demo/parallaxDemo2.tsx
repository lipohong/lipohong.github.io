import * as React from 'react';
import { useEffect } from 'react';

const ParallaxDemo2: React.FunctionComponent = () => {
    useEffect(() => {
        
        const frameCount = 147;
        const currentFrame = (index: Number) => (
            `https://www.apple.com/105/media/us/airpods-pro/2019/1299e2f5_9206_4470_b28e_08307a42f19b/anim/sequence/large/01-hero-lightpass/${index.toString().padStart(4, '0')}.jpg`
        );
        const preloadImages = () => {
            for (let i = 1; i < frameCount; i++) {
                const img = new Image();
                img.src = currentFrame(i);
            }
        };
        
        const canvas =  document.getElementById("hero-lightpass") as HTMLCanvasElement;
        const context = canvas.getContext("2d");
        canvas.width = 1158;
        canvas.height = 770;

        const img = new Image()
        img.src = currentFrame(1);
        img.onload = function(){
            context.drawImage(img, 0, 0);
        }

        const updateImage = (index: Number) => {
            img.src = currentFrame(index);
            context.drawImage(img, 0, 0);
        }

        const html = document.documentElement;
        window.onscroll = () => {
            const scrollTop = html.scrollTop;            
            const maxScrollTop = html.scrollHeight - window.innerHeight;
            const scrollFraction = scrollTop / maxScrollTop;
            const frameIndex = Math.min(
                frameCount - 1,
                Math.ceil(scrollFraction * frameCount)
            );

            requestAnimationFrame(() => updateImage(frameIndex + 1));
        }
        preloadImages();
    }, []);
    
    return (
        <div className="parallaxDemo2">
            <canvas id="hero-lightpass" />
        </div>
    )
}

export default ParallaxDemo2;