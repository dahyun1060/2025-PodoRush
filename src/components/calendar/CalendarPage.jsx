import React, { useMemo, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function CalendarPage({ onHome }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("concert");
  const [form, setForm] = useState({ name: "", location: "", time: "", venue: "" });

  const defaultChecklist = (t) =>
    t === "concert"
      ? ["티켓", "응원봉", "배터리", "신분증", "보조배터리", "물"].map((s) => ({ label: s, done: false }))
      : ["팝업차단 해제", "결제수단 확인", "배송지 등록", "데이터 키기", "구역 정해놓기"].map((s) => ({ label: s, done: false }));

  const days = useMemo(() => {
    const firstDay = new Date(current);
    const startDay = new Date(firstDay);
    startDay.setDate(1 - ((firstDay.getDay() + 6) % 7)); // 주 시작을 월요일 기준으로
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      return d;
    });
  }, [current]);

  const addEvent = () => {
    if (!selectedDate) return alert("날짜를 먼저 선택해주세요!");
    if (!form.name.trim()) return alert("콘서트명을 입력해주세요!");
    const ev = { id: Date.now(), date: selectedDate, type, checklist: defaultChecklist(type), ...form };
    setEvents((p) => [ev, ...p]);
    setShowForm(false);
    setForm({ name: "", location: "", time: "", venue: "" });
  };

  const toggleChecklist = (eventId, idx) => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const list = ev.checklist ? [...ev.checklist] : defaultChecklist(ev.type);
        list[idx] = { ...list[idx], done: !list[idx].done };
        return { ...ev, checklist: list };
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">일정 관리</h1>
          <button onClick={onHome} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            ◀️홈으로
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 캘린더 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                ←
              </button>
              <div className="text-lg font-bold text-gray-800">
                {current.getFullYear()}년 {current.getMonth() + 1}월
              </div>
              <button
                onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 mb-2">
              {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                const inMonth = d.getMonth() === current.getMonth();
                const ymd = toYmd(d);
                const hasEvent = events.some((e) => e.date === ymd);
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(ymd); setShowForm(true); }}
                    className={`h-20 rounded border text-left p-2 transition ${
                      inMonth ? "bg-white border-gray-200 hover:bg-gray-50" : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    <div className="text-sm font-semibold">{d.getDate()}</div>
                    {/* 일정 있음 표시 */}
                    {hasEvent && <div className="mt-1 text-[11px] text-blue-600">⬤</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 오른쪽: 등록된 일정 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">등록된 일정</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((ev) => (
                <div key={ev.id} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{ev.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ev.type === "concert" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}`}>
                      {ev.type === "concert" ? "콘서트" : "티켓팅"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">📅 {ev.date}</p>
                  {ev.location && <p className="text-sm text-gray-600 mb-1">📍 {ev.location}</p>}
                  {ev.time && <p className="text-sm text-gray-600 mb-1">🕒 {ev.time}</p>}
                  {ev.venue && <p className="text-sm text-gray-600">🎫 {ev.venue}</p>}
                  {ev.checklist && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm font-semibold text-gray-700 mb-2">준비물 체크리스트</div>
                      <div className="space-y-2">
                        {ev.checklist.map((c, idx) => (
                          <label key={idx} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={c.done}
                              onChange={() => toggleChecklist(ev.id, idx)}
                            />
                            <span className={c.done ? "line-through text-gray-500" : "text-gray-700"}>{c.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {events.length === 0 && <p className="text-gray-500 text-center py-8">등록된 일정이 없습니다.</p>}
            </div>
          </div>
        </div>

        {/* 일정 추가 모달: 날짜 클릭 시 자동 오픈 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-screen overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">일정 추가</h2>
              <div className="text-sm text-gray-600 mb-3">선택한 날짜: <span className="font-semibold">{selectedDate}</span></div>

              <div className="mb-4">
                <label className="block font-bold text-gray-700 mb-2">일정 유형</label>
                <div className="flex space-x-4">
                  <label className="flex items-center"><input type="radio" value="concert" checked={type === "concert"} onChange={(e) => setType(e.target.value)} className="mr-2 text-blue-600" />콘서트</label>
                  <label className="flex items-center"><input type="radio" value="ticketing" checked={type === "ticketing"} onChange={(e) => setType(e.target.value)} className="mr-2 text-blue-600" />티켓팅</label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-bold text-gray-700 mb-2">콘서트명</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="콘서트명을 입력하세요"
                />
              </div>

              {type === "concert" ? (
                <>
                  <div className="mb-4"><label className="block font-bold text-gray-700 mb-2">장소</label>
                    <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="콘서트 장소" />
                  </div>
                  <div className="mb-4"><label className="block font-bold text-gray-700 mb-2">시간</label>
                    <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4"><label className="block font-bold text-gray-700 mb-2">예매처</label>
                    <input type="text" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="멜론티켓, 인터파크 등" />
                  </div>
                  <div className="mb-4"><label className="block font-bold text-gray-700 mb-2">티켓팅 시간</label>
                    <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </>
              )}

              <div className="flex space-x-4">
                <button onClick={addEvent} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">등록</button>
                <button onClick={() => { setShowForm(false); setForm({ name: "", location: "", time: "", venue: "" }); }} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">취소</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
