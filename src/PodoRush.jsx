import React, { useEffect } from "react";
import GrapeGame from "./components/grape/GrapeGame";
import GrapeRanking from "./components/grape/GrapeRanking";
import TicketingFlow from "./components/ticketing/TicketingFlow";
import TicketRanking from "./components/ticketing/TicketRanking";
import CalendarPage from "./components/calendar/CalendarPage";
import { msToSec } from "./utils/time";
import { makeRng } from "./utils/rng";

export default function PodoRush() {
  const [screen, setScreen] = React.useState("main");

  // Dev-only sanity tests
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    console.assert(msToSec(1234) === "1.23", "msToSec works");
    const r1 = makeRng(42), r2 = makeRng(42);
    const a = [r1(), r1(), r1()].join(","), b = [r2(), r2(), r2()].join(",");
    console.assert(a === b, "rng deterministic");
  }, []);

  if (screen === "main") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-800">포도러시</h1>
          <p className="text-lg text-gray-600 mb-12">티켓팅 연습 게임</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setScreen("grape")}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold py-12 px-8 rounded-xl text-xl transition-all shadow-sm hover:shadow-md group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
              <div className="font-bold text-xl mb-2">포도알 게임</div>
              <p className="text-sm text-gray-500">반응속도 훈련</p>
            </button>

            <button
              onClick={() => setScreen("ticketing")}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold py-12 px-8 rounded-xl text-xl transition-all shadow-sm hover:shadow-md group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎫</div>
              <div className="font-bold text-xl mb-2">실전 티켓팅</div>
              <p className="text-sm text-gray-500">실제 티켓팅 연습</p>
            </button>

            <button
              onClick={() => setScreen("calendar")}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold py-12 px-8 rounded-xl text-xl transition-all shadow-sm hover:shadow-md group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📅</div>
              <div className="font-bold text-xl mb-2">일정 등록</div>
              <p className="text-sm text-gray-500">콘서트 일정 관리</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "grape")
    return <GrapeGame onHome={() => setScreen("main")} onFinish={() => setScreen("grapeRanking")} />;

  if (screen === "grapeRanking")
    return <GrapeRanking onHome={() => setScreen("main")} onRetry={() => setScreen("grape")} />;

  if (screen === "ticketing")
    return <TicketingFlow onHome={() => setScreen("main")} onFinish={() => setScreen("ticketRanking")} />;

  if (screen === "ticketRanking")
    return <TicketRanking onHome={() => setScreen("main")} />;

  if (screen === "calendar")
    return <CalendarPage onHome={() => setScreen("main")} />;

  return null;
}
