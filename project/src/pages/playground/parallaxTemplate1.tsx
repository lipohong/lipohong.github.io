import * as React from 'react';

const ParallaxTemplate1: React.FunctionComponent = () => {
    return (
        <div className="parallax">
            <div id="header">
                <h1 style={{ padding:0, margin:0 }}>Mr. & Mrs. Rogers</h1>
                Est. 2011
            </div>
            <div className="parallaxTemplate1" id="trans1">
                <div className="txt right">
                    &#10085;Live<br/>
                    Laugh<br/>
                    Love&#10085;
                </div>
                <div style={{ clear: 'both' }}></div>
                <div className="txt right sub">
                    Every Love Story is Beautiful<br/>
                    But Ours is My Favorite
                </div>
            </div>
            <div className="content">
                <img style={{ float: 'right', marginTop: '10px', marginRight: '15px' }} src="http://i1289.photobucket.com/albums/b506/katie_rogers6/447bfe0a6be943789aefab494aeb56d0_zps808779a3.png?t=1397657980" alt="Script R" />
                <h2>Jacob and Katie Rogers</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Audeo dicere, inquit. Bonum liberi: misera orbitas. Paria sunt igitur. Frater et T. Duo Reges: constructio interrete. </p>
                <p>
                    <b>Si longus, levis.</b> Quis istud possit, inquit, negare?
                    <a href='http://loripsum.net/' target='_blank'>Qualem igitur hominem natura inchoavit?</a>
                    Si quae forte-possumus. Erat enim Polemonis. Quid sequatur, quid repugnet, vident.
                </p>
                <p>
                    <a href='http://loripsum.net/' target='_blank'>Equidem e Cn.</a>
                    Falli igitur possumus. <b>Immo videri fortasse.</b> Eademne, quae restincta siti? Oratio me istius philosophi non offendit; Quamquam tu hanc copiosiorem etiam soles dicere.
                </p>
                <p>
                    <b>Conferam avum tuum Drusum cum C.</b> Praeclare hoc quidem. Verum hoc idem saepe faciamus. Tu vero, inquam, ducas licet, si sequetur; Primum divisit ineleganter; Cave putes quicquam esse verius.
                </p>
                <div style={{ clear: 'both' }}></div>
            </div>
            <div className="parallax" id="trans2">
                <div className="txt left">
                    Happiness
                </div>
                <div style={{ clear: 'both' }}></div>
                <div className="txt left sub">
                    Is Being Married to... 
                    <br/>Your Best Friend
                </div>
            </div>
            <div className="content right">
                <img style={{ float:'left', marginTop: '10px', marginLeft: '15px', width: 322, height: 250 }} src="http://i1289.photobucket.com/albums/b506/katie_rogers6/5b0e7348c9c444bd97bb920627430b73_zpsc2f7924d.png?t=1397658857" alt="Mr and Mrs"/>
                <h2>Another Content Block</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Consequens enim est et post oritur, ut dixi. Hoc ipsum elegantius poni meliusque potuit. Quo tandem modo? Sed plane dicit quod intellegit. Tibi hoc incredibile, quod beatissimum. Duo Reges: constructio interrete. Si quicquam extra virtutem habeatur in bonis. Quid enim? </p>
                <p>Comprehensum, quod cognitum non habet? Sint ista Graecorum; Quantum Aristoxeni ingenium consumptum videmus in musicis? Sequitur disserendi ratio cognitioque naturae; </p>
                <div style={{ clear: 'both' }}></div>
            </div>
            <div className="parallax" id="trans3">
                <div className="txt left">
                    and they lived...
                </div>
                <div style={{ clear: 'both' }}></div>
                <div className="txt left sub">
                    Happily Ever After
                </div>
            </div>

            <div id="footer">
                <p>Designed with Love and Care</p>
                By:<a href="http://www.dreamdesigncreate2011.com">Katie Rogers</a>
            </div>
        </div>
    );
}

export default ParallaxTemplate1;