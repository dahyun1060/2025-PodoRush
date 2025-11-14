import React, { useEffect, useMemo, useRef, useState } from "react";
import { msToSec } from "../../utils/time";
import { isNicknameTaken } from "../../utils/nickname";

const N = 20; // 20x20

export default function GrapeGame({ onHome, onFinish }) {
  const [nickname, setNickname] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [targetCells, setTargetCells] = useState([]);
  const [foundCells, setFoundCells] = useState([]);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [gameTimeMs, setGameTimeMs] = useState(0);
  const gameStartRef = useRef(null);
  const rafRef = useRef(null);

  const grid = useMemo(() => Array.from({ length: N * N }, (_, i) => i), []);

  useEffect(() => {
    if (!isGameRunning) return;
    const loop = () => {
      if (gameStartRef.current != null)
        setGameTimeMs(performance.now() - gameStartRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isGameRunning]);

  const start = () => {
    const name = nickname.trim();
    if (!name) return alert("닉네임을 입력해주세요!");

    // ★ 중복 닉네임 차단 (게임별 저장소)
    if (isNicknameTaken("podo_grape_rankings", name)) {
      alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.");
      return;
    }

    setGameStarted(true);
    setSelectedArea(null);
    setTargetCells([]);
    setFoundCells([]);
    setGameTimeMs(0);
    gameStartRef.current = performance.now();
    setIsGameRunning(true);
    try { localStorage.setItem("podo_last_grape_name", name); } 
    catch {
      // empty
      }
  };

  const selectArea = (idx) => {
    setSelectedArea(idx);
    const chosen = new Set();
    while (chosen.size < 2) chosen.add(Math.floor(Math.random() * N * N));
    setTargetCells([...chosen]);
    setFoundCells([]);
  };

  const clickCell = (index) => {
    if (!isGameRunning) return;
    if (targetCells.includes(index) && !foundCells.includes(index)) {
      const updated = [...foundCells, index];
      setFoundCells(updated);
      if (updated.length === 2) {
        setIsGameRunning(false);
        const finalMs = performance.now() - (gameStartRef.current ?? performance.now());
        try {
          const raw = localStorage.getItem("podo_grape_rankings");
          const arr = raw ? JSON.parse(raw) : [];
          const list = [...arr, { nickname: nickname.trim(), time: finalMs }]
            .sort((a, b) => a.time - b.time);
          localStorage.setItem("podo_grape_rankings", JSON.stringify(list));
        } catch {
          // empty
          }
        onFinish?.();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">포도알 게임</h1>
          <button onClick={onHome} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            ◀️홈으로
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {!gameStarted ? (
          <div className="flex justify-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">게임 시작</h2>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg mb-6 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={start} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors">
                예매하기
              </button>
              <div className="mt-6 pt-5 border-t border-gray-400">
                <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                  <li>예매하기 버튼을 누르면 타이머가 시작됩니다.</li>
                  <li><span className="font-semibold">구역 선택</span> 후 <span className="font-semibold">포도알 2개</span>를 빠르게 클릭하세요.</li>
                </ol>
              </div>
            </div>
          </div>
        ) : selectedArea === null ? (
          <div className="text-center">
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-3 inline-block">
              <span className="text-sm text-gray-600">시간: </span>
              <span className="font-mono font-bold text-blue-600">{msToSec(gameTimeMs)}초</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-8">좌석 구역을 선택하세요</h2>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {Array.from({ length: 6 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => selectArea(idx)}
                  className="bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-blue-500 text-gray-800 font-semibold py-12 px-6 rounded-xl text-xl transition-all"
                >
                  {String.fromCharCode(65 + idx)}구역
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">보라색 네모칸 2개를 클릭하세요</h2>
              <div className="flex justify-center gap-8 text-sm text-gray-600">
                <span>시간: <span className="font-mono font-bold">{msToSec(gameTimeMs)}초</span></span>
                <span>찾은 개수: <span className="font-bold text-blue-600">{foundCells.length}/2</span></span>
              </div>
            </div>

            {/* 전체도 정사각형 + 가로/세로 동일 여백 */}
            <div className="mx-auto w-full max-w-[520px] aspect-square border border-gray-200 rounded-xl p-3 bg-white">
              <div
                className="grid w-full h-full gap-[1px]"  // ← 여백 1px, 가로/세로 동일
                style={{
                  gridTemplateColumns: `repeat(${N}, 2fr)`,
                  gridTemplateRows: `repeat(${N}, 2fr)`,
                }}
              >
                {grid.map((index) => {
                  const isTarget = targetCells.includes(index);
                  const isFound = foundCells.includes(index);
                  return (
                    <button
                      key={index}
                      onClick={() => clickCell(index)}
                      className={`w-full h-full rounded-[2px] leading-none block transition-colors duration-100 ${
                        isFound ? "bg-purple-600 shadow shadow-purple-400/40"
                        : isTarget ? "bg-purple-400"
                        : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      aria-label={`cell-${index}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
