import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import VoiceGate from '../components/screens/VoiceGate';
import AgentSession from '../components/screens/AgentSession';
import Home from '../components/screens/Home';
import Insights from '../components/screens/Insights';
import Leverage from '../components/screens/Leverage';
import BottomNav from '../components/BottomNav';
import {
  loadUserData,
  loadSessions,
  loadInsights, saveInsights,
  allMessages, countUserTurns,
} from '../lib/store';

const MIN_TURNS = 4; // need a few real answers before insights mean anything

export default function App() {
  const [screen, setScreen] = useState('gate'); // gate | session | home | insights | leverage
  const [personaKey, setPersonaKey] = useState(null); // 'guide_female' | 'guide_male'
  const [userData, setUserData] = useState({});

  const [sessions, setSessions] = useState([]);
  const [insights, setInsights] = useState(null);     // { generatedAt, basisCount, data }
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Hydrate everything from local storage on first load.
  useEffect(() => {
    setUserData(loadUserData());
    setSessions(loadSessions());
    setInsights(loadInsights());
  }, []);

  const showNav = !['gate', 'session'].includes(screen);

  const generateInsights = useCallback(async (force) => {
    // AgentSession persists messages straight to the store, so always read fresh.
    const fresh = loadSessions();
    setSessions(fresh);
    const turns = countUserTurns(fresh);
    if (turns < MIN_TURNS) return;
    if (!force && insights && insights.basisCount >= turns) return; // already fresh
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages(fresh), userData, sessions: fresh }),
      });
      const data = await res.json();
      if (data.insights) {
        const obj = { generatedAt: Date.now(), basisCount: turns, data: data.insights };
        setInsights(obj);
        saveInsights(obj);
      }
    } catch (_) {}
    setInsightsLoading(false);
  }, [userData, insights]);

  function onChooseGuide(key) {
    setPersonaKey(key);
    setScreen('session');
  }

  function leaveSession() {
    // Pull any messages AgentSession wrote to the store, then refresh user data.
    setSessions(loadSessions());
    setUserData(loadUserData());
    setScreen('home');
  }

  function handleNav(s) {
    if (s === 'talk') { setScreen(personaKey ? 'session' : 'gate'); return; }
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
        {screen === 'gate' && (
          <VoiceGate onChoose={onChooseGuide} />
        )}
        {screen === 'session' && personaKey && (
          <AgentSession
            personaKey={personaKey}
            onBack={leaveSession}
          />
        )}
        {screen === 'home' && (
          <Home
            userData={userData}
            onGoSession={() => setScreen(personaKey ? 'session' : 'gate')}
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
