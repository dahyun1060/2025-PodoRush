// src/components/ticketing/TicketRanking.jsx
import React, { useMemo, useState } from "react";
import { msToSec } from "../../utils/time";

export default function TicketRanking({ onHome }) {
  // 랭킹 로드 
  const list = useMemo(() => {
    try {
      const raw = localStorage.getItem("podo_ticket_rankings");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);


  // 이번 게임에서 입력한 닉네임 (이 닉네임만 하이라이트)
  const lastName = (localStorage.getItem("podo_last_ticket_name") || "").trim();

  // 페이지네이션
  const pageSize = 10;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const pageItems = useMemo(
    () => list.slice(page * pageSize, page * pageSize + pageSize),
    [list, page]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">🏆 티켓팅 랭킹</h2>
          <button
            onClick={onHome}
            className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded hover:bg-gray-100"
          >
            ◀️홈으로
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">순위을 확인해보세요.</p>

        <div className="space-y-2 mb-4">
          {pageItems.map((r, i) => {
            const globalIndex = page * pageSize + i;
            const isMeNow = (r.name || "").trim() === lastName; // 같은 닉네임 모두 하이라이트
            return (
              <div
                key={`${r.name}-${r.time}-${globalIndex}`}
                className={`flex justify-between items-center py-2 px-3 border border-gray-100 rounded ${
                  isMeNow ? "bg-sky-100" : ""
                }`}
              >
                <span className="font-semibold text-gray-700">
                  {globalIndex + 1}. {r.name || "익명"}
                </span>
                <span className="font-mono text-blue-600 font-bold">
                  {msToSec(r.time)}초
                </span>
              </div>
            );
          })}

          {list.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              아직 기록이 없습니다.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            이전
          </button>
          <div className="text-sm text-gray-600">
            페이지 {page + 1} / {totalPages}
          </div>
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
