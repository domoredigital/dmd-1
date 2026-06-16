import { useState } from 'react';
import Head from 'next/head';
import VoicePicker from '../components/screens/VoicePicker';
import Session from '../components/screens/Session';
import Home from '../components/screens/Home';
import Insights from '../components/screens/Insights';
import Leverage from '../components/screens/Leverage';
import BottomNav from '../components/BottomNav';

export default function App() {
  const [screen, setScreen] = useState('voice'); // voice | session | home | insights | leverage
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [persona, setPersona] = useState('The Mentor');
  const [userData, setUserData] = useState({});
  const [sessionTopic, setSessionTopic] = useState('');
  const [isOnboard, setIsOnboard] = useState(true);

  const showNav = !['voice', 'session'].includes(screen) ||
    (screen === 'session' && !isOnboard);

  function goSession(topic) {
    setSessionTopic(topic);
    setIsOnboard(false);
    setScreen('session');
  }

  function onOnboardComplete(data) {
    setUserData(data);
    setIsOnboard(false);
    setScreen('home');
  }

  return (
    <>
      <Head>
        <title>DO MORE: Questions</title>
        <meta name="description" content="Better questions. Better life." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#080808" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app-shell">
        {screen === 'voice' && (
          <VoicePicker
            onSelect={(voice) => setSelectedVoice(voice)}
            onBegin={() => { setIsOnboard(true); setScreen('session'); }}
            selectedVoice={selectedVoice}
          />
        )}

        {screen === 'session' && selectedVoice && (
          <Session
            voice={selectedVoice}
            persona={persona}
            setPersona={setPersona}
            userData={userData}
            topic={sessionTopic}
            isOnboard={isOnboard}
            onOnboardComplete={onOnboardComplete}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'home' && (
          <Home
            userData={userData}
            onGoSession={goSession}
          />
        )}

        {screen === 'insights' && <Insights />}
        {screen === 'leverage' && <Leverage />}

        {showNav && (
          <BottomNav
            active={screen}
            onNav={(s) => {
              if (s === 'talk') goSession('Talk');
              else setScreen(s);
            }}
          />
        )}
      </div>
    </>
  );
}
