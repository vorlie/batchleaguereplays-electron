import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LiveTrackerPanel from "./components/LiveTrackerPanel";
import "./index.css";

// Check if this window instance was opened with the #live-tracker hash route
const isLiveWindow = window.location.hash === "#live-tracker";

function Root() {
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    if (!isLiveWindow) return;

    // Listen to the live game data channel inside the popped-out HUD window
    return window.leagueReplays.onLiveGameData((data) => {
      setLiveData(data);
    });
  }, []);

  if (isLiveWindow) {
    if (!liveData || !liveData.activePlayer) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 font-sans text-slate-400">
          <span className="relative flex h-3 w-3 mb-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-500 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-400"></span>
          </span>
          <div className="text-xs font-semibold tracking-widest uppercase text-slate-500">
            Waiting for Live League Session...
          </div>
        </div>
      );
    }

    return <LiveTrackerPanel liveData={liveData} />;
  }

  // Otherwise, render the standard Match History client app
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);