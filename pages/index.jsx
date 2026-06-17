import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import VoicePicker from '../components/screens/VoicePicker';
import Session from '../components/screens/Session';
import Home from '../components/screens/Home';
import Insights from '../components/screens/Insights';
import Leverage from '../components/screens/Leverage';
import BottomNav from '../components/BottomNav';
import {
  loadUserData, saveUserData,
  loadSessions, appendMessage,
  loadInsights, saveInsights,
  allMessages, countUserTurns,
} from '../lib/store';

const MIN_TURNS = 4; // need a few real answers before insights mean anything

export default function App() {
  const [screen, setScreen] = useState('voice'); // voice | session | home | insights | leverage
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [persona, setPersona] = useState('The Mentor');
  const [userData, setUserData] = useState({});
  const [sessionTopic, setSessionTopic] = useState('');
  const [isOnboard, setIsOnboard] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [insights, setInsights] = useState(null);     // { generatedAt, basisCount, data }
  const [insightsLoading, setInsightsLoading] = useState(false);

  const currentSessionId = useRef(null);
  const personaRef = useRef(persona);
  const topicRef = useRef(sessionTopic);
  useEffect(() => { personaRef.current = persona; }, [persona]);
  useEffect(() => { topicRef.current = sessionTopic; }, [sessionTopic]);

  // Hydrate everything from local storage on first load.
  useEffect(() => {
    setUserData(loadUserData());
    setSessions(loadSessions());
    setInsights(loadInsights());
  }, []);

  const showNav = !['voice', 'session'].includes(screen) ||
    (screen === 'session' && !isOnboard);

  // Capture each live-session message into the persistent store.
  const handleSessionMessage = useCallback((msg) => {
    const id = currentSessionId.current;
    if (!id) return;
    const meta = { persona: personaRef.current, topic: topicRef.current };
    setSessions((prev) => appendMessage(prev, id, meta, msg));
  }, []);

  const generateInsights = useCallback(async (force) => {
    const turns = countUserTurns(sessions);
    if (turns < MIN_TURNS) return;
    if (!force && insights && insights.basisCount >= turns) return; // already fresh
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages(sessions), userData }),
      });
      const data = await res.json();
      if (data.insights) {
        const obj = { generatedAt: Date.now(), basisCount: turns, data: data.insights };
        setInsights(obj);
        saveInsights(obj);
      }
    } catch (_) {}
    setInsightsLoading(false);
  }, [sessions, userData, insights]);

  function goSession(topic) {
    setSessionTopic(topic);
    setIsOnboard(false);
    currentSessionId.current = `sess_${Date.now()}`;
    setScreen('session');
  }

  function onOnboardComplete(data) {
    setUserData(data);
    saveUserData(data);
    setIsOnboard(false);
    setScreen('home');
  }

  function handleNav(s) {
    if (s === 'talk') { goSession('Talk'); return; }
    setScreen(s);
    if (s === 'insights' || s === 'leverage') generateInsights(false);
  }

  const userTurns = countUserTurns(sessions);

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
            onBegin={() => { setIsOnboard(true); currentSessionId.current = null; setScreen('session'); }}
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
            onMessage={handleSessionMessage}
            onBack={() => setScreen('home')}
          />
        )}
        {screen === 'home' && (
          <Home
            userData={userData}
            onGoSession={goSession}
          />
        )}
        {screen === 'insights' && (
          <Insights
            data={insights?.data}
            loading={insightsLoading}
            userTurns={userTurns}
            onRefresh={() => generateInsights(true)}
          />
        )}
        {screen === 'leverage' && (
          <Leverage
            data={insights?.data}
            loading={insightsLoading}
            userTurns={userTurns}
            onRefresh={() => generateInsights(true)}
          />
        )}
        {showNav && (
          <BottomNav
            active={screen}
            onNav={handleNav}
          />
        )}
      </div>
    </>
  );
}
