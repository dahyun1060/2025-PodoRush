// src/components/ticketing/TicketingFlow.jsx
import React, { useEffect, useState } from "react";
import { msToSec } from "../../utils/time";
import { isNicknameTaken } from "../../utils/nickname";
import { makeRng } from "../../utils/rng";

/* ===== 상수 ===== */
const COLS = 12;
const ROWS = 8;
const TOTAL = COLS * ROWS;
const TIMES = [{ value: "18:00", label: "18시 00분" }];
const BANKS = ["신한", "KB국민", "우리", "하나", "카카오"];

/* ===== 타이머 (부모 리렌더와 분리) ===== */
function Timer({ startTs, running }) {
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (!running || !startTs) return;
    let raf = 0;
    const tick = () => {
      // 매 플레임 갱신
      setNow(performance.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, startTs]);

  const ms = running && startTs ? now - startTs : 0;
  return <span className="font-mono font-bold text-blue-600">{msToSec(ms)}초</span>;
}

/* ===== 본 컴포넌트 ===== */
export default function TicketingFlow({ onHome, onFinish }) {
  // 단계: 0 이름, 1 날짜/시간, 2 좌석, 3 가격, 4 결제, 5 완료(fallback)
  const [step, setStep] = useState(0);

  // 입력 상태
  const [buyerName, setBuyerName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // 좌석
  const [seatMap, setSeatMap] = useState([]); // boolean[]
  const [selectedSeats, setSelectedSeats] = useState([]); // number[]
  const [quantity, setQuantity] = useState(0); // 0~2

  // 결제/수령
  const [deliveryMethod, setDeliveryMethod] = useState(null); // "shipping" | "onsite" | null
  const [paymentMethod, setPaymentMethod] = useState(null);   // "card" | "transfer" | "kakao" | null
  const [bank, setBank] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // 타이머 (부모는 시작 시각만 들고, 표시/갱신은 Timer가 전담)
  const [running, setRunning] = useState(false);
  const [startTs, setStartTs] = useState(null);

  /* ===== 단계 전환 ===== */
  const goDateStep = () => {
    const name = buyerName.trim();
    if (!name) return alert("닉네임을 입력해주세요!");
    if (isNicknameTaken("podo_ticket_rankings", name)) {
      alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.");
      return;
    }
    setStep(1);
    setStartTs(performance.now()); // 타이머 시작 기준 시각 고정
    setRunning(true);
  };

  // 날짜 클릭 시: 날짜 선택 + 18:00 자동 선택 + 버튼 하이라이트
  const handleSelectDate = (d) => {
    setSelectedDate(d);
    setSelectedTime("18:00");
  };

  // 날짜선택 → 좌석선택
  const proceedSeats = () => {
    if (!selectedDate) return alert("날짜를 선택해주세요."); // 시간은 자동 선택
    setStep(2);
    const rng = makeRng(Date.now());
    setSeatMap(Array.from({ length: TOTAL }, () => rng() > 0.3));
    setSelectedSeats([]);
  };

  // 좌석 토글 (최대 2개)
  const toggleSeat = (index) => {
    if (!seatMap[index]) return; // 매진
    setSelectedSeats((prev) => {
      const exists = prev.includes(index);
      if (exists) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return prev;
      return [...prev, index];
    });
  };

  // 가격 → 결제
  const nextFromPrice = () => {
    if (quantity !== selectedSeats.length) {
      alert("매수가 일치하지 않습니다!");
      return;
    }
    setStep(4);
  };

  // 결제 완료
  const finalize = () => {
    if (!deliveryMethod) return alert("수령 방법을 선택해주세요.");
    if (!paymentMethod) return alert("결제수단을 선택해주세요.");
    if ((paymentMethod === "card" || paymentMethod === "transfer") && !bank)
      return alert("은행을 선택해주세요.");
    if (!(agreeTerms && agreePrivacy)) return alert("필수 약관에 동의해주세요.");

    setRunning(false);
    const end = performance.now();
    const finalMs = (startTs ? end - startTs : 0);

    try {
      const raw = localStorage.getItem("podo_ticket_rankings");
      const arr = raw ? JSON.parse(raw) : [];
      const list = [...arr, { name: buyerName.trim() || "익명", time: finalMs }]
        .sort((a, b) => a.time - b.time);
      localStorage.setItem("podo_ticket_rankings", JSON.stringify(list));
      localStorage.setItem("podo_last_ticket_name", buyerName.trim() || "익명");
    } catch {
      // empty
      }

    if (typeof onFinish === "function") onFinish();
    else setStep(5);
  };

  const total =
    154000 * quantity +
    2000 +
    (deliveryMethod === "shipping" ? 2500 : 0);

  /* ===== UI 조각 (날짜/시간 카드) ===== */
  /*<div className="rounded-xl overflow-hidden bg-gray-200 aspect-[3/4]" />*/

  const EventInfo = () => (
    <div className="bg-white border border-rose-100 rounded-2xl p-5">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start">
        <div className=" w-[160px] md:w-[200px]">
          <img
            src="/images/aespa-poster.jpg"
            alt="aespa 포스터"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-rose-200 text-rose-800 text-[11px] font-bold mb-2">
            단독판매
          </span>
          <h2 className="text-xl font-extrabold text-gray-900 leading-snug mb-2">
            2025 aespa LIVE TOUR - SYNK : aeXIS LINE -
          </h2>
          <div className="space-y-0.5 text-gray-700 text-[14px]">
            <div><span className="font-semibold">공연기간:</span> 2025.08.30 - 2025.08.31</div>
            <div><span className="font-semibold">공연장:</span> KSPO DOME </div>
            <div><span className="font-semibold">관람등급:</span> 9세 이상</div>
            <div><span className="font-semibold">장르:</span> 콘서트</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-bold text-gray-800 mb-2">날짜 선택</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { d: "2025-08-30", label: "2025년 08월 30일 (토)" },
            { d: "2025-08-31", label: "2025년 08월 31일 (일)" },
          ].map(({ d, label }) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSelectDate(d)}
              className={`px-4 py-2 rounded-xl border text-[14px] ${
                selectedDate === d
                  ? "border-rose-400 bg-rose-50 text-rose-700"
                  : "border-rose-200 text-gray-800 hover:bg-rose-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <h3 className="text-base font-bold text-gray-800 mt-5 mb-2">시간 선택</h3>
        <div className="flex flex-wrap gap-2">
          {TIMES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedTime(value)}
              className={`px-4 py-2 rounded-xl border text-[14px] ${
                selectedTime === value
                  ? "border-rose-400 bg-rose-50 text-rose-700"
                  : "border-rose-200 text-gray-800 hover:bg-rose-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-right mt-6">
          <button
            type="button"
            onClick={proceedSeats}
            className="px-6 py-3 rounded-xl bg-rose-400 text-white font-bold hover:bg-rose-500"
            disabled={!selectedDate} // 날짜 선택해야 활성화
          >
            예매하기
          </button>
        </div>
      </div>
    </div>
  );

  /* ===== 렌더 ===== */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">실전 티켓팅</h1>
          <button
            type="button"
            onClick={onHome}
            className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ◀️홈으로
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* 0. 이름 입력 */}
        {step === 0 && (
          <div className="flex justify-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">이름 입력</h2>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg mb-6 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={goDateStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
              >
                예매하기
              </button>
              <div className="mt-6 pt-5 border-t border-gray-400">
                <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
                  <li>예매하기 버튼을 누르면 타이머가 시작됩니다.</li>
                  <li><span className="font-semibold">날짜 → 좌석(최대 2매) → 가격</span>을 순서대로 선택하세요.</li>
                  <li><span className="font-semibold">배송/결제 정보</span>를 입력한 뒤 결제하기를 누르세요.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* 1. 날짜/시간 (타이머 + 카드) */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="bg-white border border-gray-200 rounded-lg px-4 py-2 inline-block">
                <span className="text-sm text-gray-600">시간: </span>
                <Timer startTs={startTs} running={running} />
              </span>
            </div>
            <EventInfo />
          </div>
        )}

        {/* 2. 좌석 선택 */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 inline-block">
                <span className="text-sm text-gray-600">시간: </span>
                <Timer startTs={startTs} running={running} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl mx-auto">
              <div className="text-center mb-4">
                <div className="bg-gray-800 text-white py-2 px-4 rounded-lg inline-block mb-4">
                  무대 (STAGE)
                </div>
              </div>

              <div className="grid [grid-template-columns:repeat(12,minmax(0,1fr))] gap-[6px] max-w-[520px] mx-auto">
                {seatMap.map((avail, index) => {
                  const isSelected = selectedSeats.includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleSeat(index)}
                      disabled={!avail && !isSelected}
                      title={`${Math.floor(index / COLS) + 1}열 ${(index % COLS) + 1}번`}
                      className={`aspect-square leading-none rounded text-[10px] font-semibold transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md"
                          : avail
                          ? "bg-gray-100 hover:bg-blue-100 border border-gray-300 hover:border-blue-400 text-gray-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {selectedSeats.length > 0 && (
                <div className="text-center mt-6 space-y-2">
                  <div className="text-sm text-gray-700">
                    선택한 좌석:{" "}
                    {selectedSeats
                      .map((i) => `${Math.floor(i / COLS) + 1}열 ${(i % COLS) + 1}번`)
                      .join(", ")}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                  >
                    좌석 선택 완료
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. 가격/매수 */}
        {step === 3 && (
          <div className="flex justify-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-2xl w-full shadow-sm">
              <div className="text-center mb-4">
                <span className="bg-white border border-gray-200 rounded-lg px-4 py-2 inline-block">
                  <span className="text-sm text-gray-600">시간: </span>
                  <Timer startTs={startTs} running={running} />
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">티켓가격을 선택하세요</h2>
              <div className="border border-gray-200 rounded-lg divide-y">
                <div className="flex items-center justify-between p-4 gap-3">
                  <div className="font-semibold text-gray-800">일반</div>
                  <div className="text-gray-700">기본가</div>
                  <div className="font-bold">154,000원</div>
                  <select
                    className="border border-gray-300 rounded px-2 py-1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    <option value={0}>0매</option>
                    <option value={1}>1매</option>
                    <option value={2}>2매</option>
                  </select>
                </div>
              </div>

              <div className="text-right mt-6">
                <button
                  type="button"
                  onClick={nextFromPrice}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. 결제 */}
        {step === 4 && (
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6">
              <span className="bg-white border border-gray-200 rounded-lg px-4 py-2 inline-block">
                <span className="text-sm text-gray-600">시간: </span>
                <Timer startTs={startTs} running={running} />
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 왼쪽: 수령 + 주문/주소 */}
              <div className="space-y-6">
                {/* 수령 방법 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">수령 방법</h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="delivery"
                        className="mr-4 text-blue-600"
                        checked={deliveryMethod === "shipping"}
                        onChange={() => setDeliveryMethod("shipping")}
                      />
                      <div>
                        <div className="font-semibold text-gray-800">배송 (2,500원)</div>
                        <div className="text-sm text-gray-500">일반배송</div>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="delivery"
                        className="mr-4 text-blue-600"
                        checked={deliveryMethod === "onsite"}
                        onChange={() => setDeliveryMethod("onsite")}
                      />
                      <div>
                        <div className="font-semibold text-gray-800">현장수령</div>
                        <div className="text-sm text-gray-500">공연 당일 현장에서 수령</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 주문자 정보 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">주문자 정보</h3>
                  <p className="text-sm text-gray-700">이름: <span className="font-semibold">{buyerName || "익명"}</span></p>
                  <p className="text-sm text-gray-700">연락처: <span className="font-semibold">010-1234-5678</span></p>
                  <p className="text-sm text-gray-700">이메일: <span className="font-semibold">email@naver.com</span></p>
                </div>

                {/* 배송지 정보 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">배송지 정보</h3>
                  {deliveryMethod === "shipping" ? (
                    <>
                      <p className="text-sm text-gray-700">수령인: <span className="font-semibold">{buyerName || "익명"}</span></p>
                      <p className="text-sm text-gray-700">주소: <span className="font-semibold">서울시 마포구 대흥로 175, 10층</span></p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">현장수령은 배송지 정보가 필요 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 오른쪽: 결제수단 → 결제 정보 → 결제하기 */}
              <div className="space-y-6">
                {/* 결제수단 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">결제수단</h3>
                  <div className="space-y-3 mb-4">
                    {[
                      { key: "card", label: "신용카드" },
                      { key: "transfer", label: "무통장입금" },
                      { key: "kakao", label: "카카오페이" },
                    ].map((m) => (
                      <label key={m.key} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="payment"
                          className="mr-4 text-blue-600"
                          checked={paymentMethod === m.key}
                          onChange={() => { setPaymentMethod(m.key); setBank(""); }}
                        />
                        <span className="font-semibold text-gray-800">{m.label}</span>
                      </label>
                    ))}
                  </div>

                  {(paymentMethod === "card" || paymentMethod === "transfer") && (
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                    >
                      <option value="">은행을 선택하세요</option>
                      {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  )}
                </div>

                {/* 결제 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-4">결제 정보</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">공연</span><span className="text-right text-gray-800">2025 aespa LIVE TOUR - SYNK : aeXIS LINE -</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">날짜</span><span className="text-gray-800">{selectedDate || "-"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">시간</span><span className="text-gray-800">{selectedTime || "-"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">좌석</span><span className="text-gray-800">{selectedSeats.length ? selectedSeats.map((i) => `${Math.floor(i / COLS) + 1}열 ${(i % COLS) + 1}번`).join(", ") : "-"}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">티켓 금액</span><span className="text-gray-800">{(154000 * quantity).toLocaleString()}원</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">예매수수료</span><span className="text-gray-800">2,000원</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">배송비</span><span className="text-gray-800">{deliveryMethod === "shipping" ? "2,500원" : "0원"}</span></div>
                    <hr className="border-blue-300" />
                    <div className="flex justify-between font-bold text-blue-800 text-lg"><span>총 결제금액</span><span>{total.toLocaleString()}원</span></div>
                  </div>
                </div>

                {/* 동의 + 결제하기 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />예매 약관에 동의합니다 (필수)</label>
                    <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />개인정보 수집 및 이용에 동의합니다 (필수)</label>
                  </div>
                  <button
                    type="button"
                    onClick={finalize}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors"
                  >
                    결제하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 결제 완료 (fallback) */}
        {step === 5 && (
          <div className="flex justify-center">
            <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">결제 완료!</h2>
              <p className="text-gray-600 mb-6">랭킹 화면에서 기록을 확인해 보세요.</p>
              <button
                type="button"
                onClick={onHome}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
