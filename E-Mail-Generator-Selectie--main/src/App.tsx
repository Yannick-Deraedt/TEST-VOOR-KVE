import { useState, useEffect } from "react";
import FloatingCopyButton from "./FloatingCopyButton";
import Confetti from "./Confetti";
import clublogo from "./assets/clublogo.png";
import { TEAMS, getTeamById } from "./teams";

// ------- CONSTANTEN & DATA
const maxSpelers = 16;

// Rugnummers: 1..17 + 25 (2e keeperstrui)
const jerseyNumbers: number[] = Array.from({ length: 17 }, (_, i) => i + 1);
jerseyNumbers.push(25);

const nonSelectionReasons = [
  "Geblesseerd", "Ziek", "Afwezig", "Beurtrol", "Op vakantie",
  "GU15","Stand-by GU15", "1x getraind", "Schoolverplichtingen",
  "Te laat afgemeld/niet verwittigd", "Geschorst", "Andere reden"
];

const days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

// ------- HULP: tijdformat & -berekening
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatHHMM(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/** time: "HH:MM", returns "HH:MM" minus 75 minutes (date component is irrelevant for display) */
function minus75min(timeHHMM: string) {
  if (!timeHHMM) return "";
  const [hh, mm] = timeHHMM.split(":").map((x) => parseInt(x, 10));
  const base = new Date();
  base.setHours(hh, mm, 0, 0);
  base.setMinutes(base.getMinutes() - 75);
  return formatHHMM(base);
}

export default function App() {
  // ------- TEAM SELECTOR (optie 1: geen accounts)
  const [teamId, setTeamId] = useState<string>(() => {
    return localStorage.getItem("kve_teamId") || "";
  });
  const team = getTeamById(teamId || TEAMS[0].id);

  // ------- KERN- & KEEPERSLIJSTEN
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [keeperList, setKeeperList] = useState<string[]>([]);

  useEffect(() => {
    if (!teamId) {
      setPlayerList([]);
      return;
    }
    fetch(`${team.publicFolder}/squad_players.txt`)
      .then((res) => res.text())
      .then((text) => {
        const players = text.split("\n").map((p) => p.trim()).filter(Boolean);
        const uniqueSorted = Array.from(new Set(players)).sort();
        setPlayerList(uniqueSorted);
      })
      .catch((err) => console.error("Error loading squad_players.txt:", err));
  }, [teamId]);

  useEffect(() => {
    if (!teamId) {
      setKeeperList([]);
      return;
    }
    fetch(`${team.publicFolder}/keepers.txt`)
      .then((res) => res.text())
      .then((text) => {
        const keepers = text.split("\n").map((k) => k.trim()).filter(Boolean);
        const uniqueSorted = Array.from(new Set(keepers)).sort();
        setKeeperList(uniqueSorted);
      })
      .catch((err) => console.error("Error loading keepers.txt:", err));
  }, [teamId]);

  // Bewaar keuze
  useEffect(() => {
    if (teamId) localStorage.setItem("kve_teamId", teamId);
  }, [teamId]);

  // ------- STATES VOOR WEDSTRIJD
  const [matchType, setMatchType] = useState("Thuiswedstrijd");
  const [date, setDate] = useState("");
  const [day, setDay] = useState("");
  const handleDateChange = (d: string) => {
    setDate(d);
    const parsed = new Date(d);
    setDay(days[parsed.getDay() as number]);
  };

  const [time, setTime] = useState("");
  const [opponent, setOpponent] = useState("");
  const [field, setField] = useState("");

  // Uit: gathering (parking)
  const [gatheringPlace, setGatheringPlace] = useState("");
  const [customGatheringPlace, setCustomGatheringPlace] = useState(false);
  const [gatheringTime, setGatheringTime] = useState("");
  const [address, setAddress] = useState("");

  const [responsible, setResponsible] = useState("");
  const [remark, setRemark] = useState("Vergeet jullie ID niet mee te nemen! Geen ID = Niet spelen!");
  const [preview, setPreview] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ------- SELECTIE STATES
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, string>>({});
  const [nonSelectedReasons, setNonSelectedReasons] = useState<Record<string, string>>({});
  const [nonSelectedComments, setNonSelectedComments] = useState<Record<string, string>>({});
  const [searchSelect, setSearchSelect] = useState("");
  const [searchRugnummer, setSearchRugnummer] = useState("");
  const [showSelection, setShowSelection] = useState(true);
  const [showNotSelected, setShowNotSelected] = useState(true);

  // Verzamelplaats automatisch
  useEffect(() => {
    if (!customGatheringPlace) {
      if (matchType === "Uitwedstrijd") {
        if (!gatheringPlace || gatheringPlace.trim().toLowerCase().includes("kleedkamer")) {
          setGatheringPlace("Parking KVE");
        }
      } else {
        // Thuis gebruiken we geen gatheringPlace, dus niets forceren
      }
    }
  }, [matchType, customGatheringPlace, gatheringPlace]);

  // ------- HULP
  function isKeeper(name: string) {
    return keeperList.includes(name);
  }

  const allNotSelected: string[] = [
    ...playerList.filter((p) => !(p in selectedPlayers)),
    ...keeperList.filter((k) => !(k in selectedPlayers)),
  ];

  let sortedNotSelected = [...allNotSelected];
  if (searchSelect.trim()) {
    const q = searchSelect.toLowerCase();
    const top = sortedNotSelected.filter((p) => p.toLowerCase().includes(q));
    const rest = sortedNotSelected.filter((p) => !p.toLowerCase().includes(q));
    sortedNotSelected = [...top, ...rest];
  }

  const availableKeepers: string[] = keeperList.filter((k) => !(k in selectedPlayers));

  const selected: string[] = Object.keys(selectedPlayers).sort(
    (a, b) => Number(selectedPlayers[a]) - Number(selectedPlayers[b])
  );

  const usedNumbers = new Set(Object.values(selectedPlayers).filter(Boolean));
  const alleRugnummersUniek =
    selected.length === new Set(Object.values(selectedPlayers).filter(Boolean)).size &&
    !selected.some((p) => !selectedPlayers[p]);

  // ------- HANDLERS
  function handleSelect(player: string) {
    setSelectedPlayers((prev) => ({ ...prev, [player]: "" }));
    setNonSelectedReasons((prev) => {
      const u = { ...prev };
      delete u[player];
      return u;
    });
    setNonSelectedComments((prev) => {
      const u = { ...prev };
      delete u[player];
      return u;
    });
    setSearchSelect("");
  }

  function removeSelected(player: string) {
    setSelectedPlayers((prev) => {
      const u = { ...prev };
      delete u[player];
      return u;
    });
  }

  function handleRugnummer(player: string, nummer: string) {
    setSelectedPlayers((prev) => ({ ...prev, [player]: nummer }));
  }

  function handleNonSelectedReason(player: string, reason: string) {
    setNonSelectedReasons((prev) => ({ ...prev, [player]: reason }));
  }

  function handleNonSelectedComment(player: string, comment: string) {
    setNonSelectedComments((prev) => ({ ...prev, [player]: comment }));
  }

  function handleResponsible(player: string) {
    setResponsible(player);
  }

  function autoToewijzen() {
    const vrije = jerseyNumbers.filter((n) => !Object.values(selectedPlayers).includes(n.toString()));
    let i = 0;
    setSelectedPlayers((prev) => {
      const u = { ...prev };
      for (const p of Object.keys(u)) {
        if (!u[p] && vrije[i]) {
          u[p] = vrije[i].toString();
          i += 1;
        }
      }
      return u;
    });
  }

  // ---------- KOPIEER + KONFETTI ----------
  const copyToClipboard = async () => {
    const el = document.querySelector("#mailpreview-only");
    if (el && navigator.clipboard && (window as any).ClipboardItem) {
      const html = (el as HTMLElement).innerHTML;
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }) }),
      ]);
      setSuccess(true);
      setShowConfetti(true);
      setTimeout(() => setSuccess(false), 2500);
      setTimeout(() => setShowConfetti(false), 15000);
    } else {
      alert("Kopiëren niet ondersteund in deze browser.");
    }
  };

  // -------- GENERATE EMAIL & LIVE PREVIEW --------
  function generateEmail() {
    if (!date || !time || !opponent) {
      setPreview(`<div style="padding:16px;text-align:center;color:#a00;">Vul datum, tijd en tegenstander in.</div>`);
      return;
    }

    const hoofdKleur = matchType === "Uitwedstrijd" ? "#1679bc" : "#142c54";
    const arrivalAtVenue = minus75min(time); // 1u15 voor aftrap

    // Wedstrijddetails
    let detailsRows = `
      <tr><td style="font-weight:600;width:175px;">Dag:</td><td><strong>${day}</strong></td></tr>
      <tr><td style="font-weight:600;">Type wedstrijd:</td><td><strong>${matchType}</strong></td></tr>
      <tr>
        <td style="font-weight:600;">Datum:</td>
        <td><strong>${new Date(date).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}</strong></td>
      </tr>
      <tr><td style="font-weight:600;">Start wedstrijd:</td><td><strong>${time}</strong></td></tr>
      <tr><td style="font-weight:600;">Tegenstander:</td><td><strong>${opponent}</strong></td></tr>
      <tr><td style="font-weight:600;">Terrein:</td><td>${field}</td></tr>
    `;

    if (matchType === "Uitwedstrijd") {
      detailsRows += `
        <tr><td style="font-weight:600;">Adres:</td><td>${address}</td></tr>
        <tr><td style="font-weight:600;">Aankomst tegenstander:</td><td><strong>${arrivalAtVenue} (${opponent})</strong></td></tr>
        <tr><td style="font-weight:600;">Verzamelen (parking):</td><td>Om <strong>${gatheringTime}</strong> aan <strong>${gatheringPlace}</strong></td></tr>
      `;
    } else {
      detailsRows += `
        <tr><td style="font-weight:600;">Aankomst kleedkamer:</td><td><strong>${arrivalAtVenue} (KVE Drongen)</strong></td></tr>
      `;
    }

    const carpoolText =
      matchType === "Uitwedstrijd"
        ? `<div style="margin-top:10px;background:#e8f4fc;padding:10px;border-radius:6px;border:1px solid #c0e6fa;">
            <strong>Vervoer:</strong> Samen vertrekken vanaf Parking KVE (carpoolen mogelijk). Is het voor jullie >15 min omweg? Dan mag je rechtstreeks rijden — graag aangeven via WhatsApp-poll.
          </div>`
        : "";

    // Selectie-rijen
    const selectionTableRows = selected
      .map((player: string) => `
        <tr style="${responsible === player ? 'background:#e6ffe6;box-shadow:0 0 0 2px #39f7;filter:drop-shadow(0 0 6px #80ee90);' : ''}">
          <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;">#${selectedPlayers[player] || "-"}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;">${player}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e0e0e0;text-align:center;">
            ${responsible === player ? "✅ Verantwoordelijk voor was, fruit & chocomelk" : ""}
          </td>
        </tr>
      `)
      .join("");

    // Niet-geselecteerden (keepers + veldspelers)
    const nonSelectedTableRows = [...allNotSelected]
      .map((player: string) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #ffe2e2;">${player}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #ffe2e2;">${nonSelectedReasons[player] || "-"}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #ffe2e2;">${nonSelectedComments[player] || ""}</td>
        </tr>
      `)
      .join("");

    const html = `
      <div style="font-family:sans-serif;line-height:1.6;max-width:640px;margin:auto;background:#fff;color:#222;border-radius:16px;box-shadow:0 8px 32px #284cff11;">
        <div style="background:${hoofdKleur};border-radius:16px 16px 0 0;padding:18px 28px 14px 28px;margin-bottom:20px; color:#fff;display:flex;align-items:center;">
          <img src="https://i.imgur.com/cgvdj96.png" alt="logo" style="height:48px;margin-right:18px;border-radius:13px;box-shadow:0 1px 7px #0003"/>
          <div>
            <div style="font-size:1.22em;font-weight:700;letter-spacing:1px;">${team.subtitle ?? "KVE Drongen"}</div>
            <div style="font-size:1.05em;font-weight:400;opacity:0.97;">Wedstrijddetails & selectie – ${team.label}</div>
          </div>
        </div>

        <div style="background:#e7effb;border-radius:11px;padding:16px 22px 10px 22px;margin-bottom:20px;">
          <h2 style="margin:0 0 8px 0;font-size:1.08em;font-weight:700;color:${hoofdKleur};">Wedstrijddetails</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${detailsRows}
          </table>
          ${carpoolText}
        </div>

        <div style="background:#f1ffe9;border-radius:11px;padding:15px 22px;margin-bottom:16px;">
          <h2 style="margin:0 0 8px 0;font-size:1.08em;font-weight:700;color:#178530;">Selectie</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#d1f7b3;">
                <th style="text-align:left;padding:6px 12px;">Rugnummer</th>
                <th style="text-align:left;padding:6px 12px;">Naam speler</th>
                <th style="text-align:left;padding:6px 12px;">Verantwoordelijk</th>
              </tr>
            </thead>
            <tbody>${selectionTableRows}</tbody>
          </table>
        </div>

        <div style="background:#fff7f7;border-radius:11px;padding:15px 22px;margin-bottom:14px;">
          <h2 style="margin:0 0 8px 0;font-size:1.08em;font-weight:700;color:#e66472;">Niet geselecteerd</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#ffd7d7;">
                <th style="text-align:left;padding:6px 12px;">Naam speler</th>
                <th style="text-align:left;padding:6px 12px;">Reden</th>
                <th style="text-align:left;padding:6px 12px;">Opmerking</th>
              </tr>
            </thead>
            <tbody>${nonSelectedTableRows}</tbody>
          </table>
        </div>

        <div style="background:#fffbe6;border-radius:8px;padding:14px 18px;">
          <p style="margin:0;"><strong>Opmerking:</strong> ${remark}</p>
        </div>
        <br/><br/>
        <p style="margin-top:34px;margin-bottom:6px;">Sportieve groeten,</p>
        <p style="margin:0;font-weight:600;">${team.signatureLines.join("<br/>")}</p>
      </div>
    `;
    setPreview(html);
  }

  useEffect(() => {
    generateEmail();
    // eslint-disable-next-line
  }, [
    matchType, date, time, opponent, field, address, gatheringPlace, customGatheringPlace, gatheringTime,
    responsible, remark, selectedPlayers, nonSelectedReasons, nonSelectedComments
  ]);

  // --------- EASTER EGG: confetti bij 15 totaal met ≥1 keeper
  useEffect(() => {
    const names = Object.keys(selectedPlayers);
    const keepersSel = names.filter((n) => isKeeper(n)).length;
    const total = names.length;
    if (total === 15 && keepersSel >= 1) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 15000);
      return () => clearTimeout(t);
    }
  }, [selectedPlayers, keeperList]);

  // --------- RENDER
  return (
    <>
      {/* Watermerk met ‘adem’-animatie */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          zIndex: 0,
          background: `url(${clublogo}) center center no-repeat`,
          backgroundSize: "56vw",
          opacity: 0.3,
          animation: "watermark-fade 7s ease-in-out infinite alternate",
          pointerEvents: "none"
        }}
      />

      {/* Confetti */}
      <Confetti active={showConfetti} duration={15000} />

      {!teamId ? (
        <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ position: "relative", zIndex: 1 }}>
          <div className="w-full max-w-xl bg-blue-50 rounded-2xl shadow-strong p-6 section-card">
            <div className="flex items-center gap-4 mb-4">
              <img src={clublogo} alt="clublogo" style={{ height: 64, borderRadius: 16, boxShadow: "0 1px 8px #2166aa55" }} />
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#142c54" }}>Selecteer je team</div>
                <div style={{ opacity: 0.8 }}>Kies één team en je komt meteen in jullie selectie-tool.</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEAMS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTeamId(t.id)}
                  className="p-4 rounded-xl bg-white border border-blue-200 text-left hover:shadow"
                >
                  <div style={{ fontWeight: 800, color: "#142c54", fontSize: "1.15rem" }}>{t.label}</div>
                  {t.subtitle && <div style={{ opacity: 0.75 }}>{t.subtitle}</div>}
                </button>
              ))}
            </div>

            <div className="mt-5 text-sm" style={{ opacity: 0.75 }}>
              Tip: teams toevoegen/aanpassen doe je in <strong>src/teams.ts</strong> + bestanden in <strong>/public/teams/</strong>.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 w-full p-0 m-0" style={{ position: "relative", zIndex: 1 }}>
          {/* LINKERDEEL: INPUT */}
          <div className="w-full md:w-1/2 p-3 md:pl-8 pt-6 md:pt-12 flex flex-col">
            <div className="flex items-center justify-between mb-4" style={{ position: "relative", zIndex: 2 }}>
            <img src={clublogo} alt="clublogo" style={{ height: 54, marginRight: 16, borderRadius: 14, boxShadow: "0 1px 8px #2166aa55" }} />
              <span style={{ fontSize: "2.1rem", fontWeight: 900, letterSpacing: "1.5px", color: "#142c54",
                textShadow: "0 1px 16px #fff7, 0 1px 2px #0d183799", padding: "2px 7px", borderRadius: "8px" }}>
                E-mail Generator – {team.label}
              </span>

              <button
                onClick={() => setTeamId("")}
                className="ml-3 px-3 py-2 rounded-lg bg-white border border-blue-200 hover:shadow text-sm"
              >
                Team wijzigen
              </button>
            </div>

          <div className="bg-blue-50 rounded-xl p-4 shadow mb-6">
            <ul className="space-y-4">
              <li>
                <label className="block font-semibold mb-1 text-blue-800">Type wedstrijd <span className="text-red-500">*</span></label>
                <select value={matchType} onChange={(e) => setMatchType(e.target.value)} className="w-full p-2 rounded text-black">
                  <option>Thuiswedstrijd</option>
                  <option>Uitwedstrijd</option>
                </select>
              </li>
              <li>
                <label className="block font-semibold mb-1 text-blue-800">Datum <span className="text-red-500">*</span></label>
                <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} className="w-full p-2 rounded text-black" />
              </li>
              <li>
                <label className="block font-semibold mb-1 text-blue-800">Start wedstrijd <span className="text-red-500">*</span></label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-2 rounded text-black" />
              </li>
              <li>
                <label className="block font-semibold mb-1 text-blue-800">Tegenstander <span className="text-red-500">*</span></label>
                <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full p-2 rounded text-black" />
              </li>
              <li>
                <label className="block font-semibold mb-1 text-blue-800">Terrein</label>
                <input type="text" value={field} onChange={(e) => setField(e.target.value)} className="w-full p-2 rounded text-black" />
              </li>

              {matchType === "Uitwedstrijd" && (
                <>
                  <li>
                    <label className="block font-semibold mb-1 text-blue-800">Adres</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 rounded text-black" />
                  </li>
                  <li>
                    <label className="block font-semibold mb-1 text-blue-800">Verzamelen (parking)</label>
                    <div className="flex gap-2">
                      <input type="time" value={gatheringTime} onChange={(e) => setGatheringTime(e.target.value)} className="w-full p-2 rounded text-black" />
                      {!customGatheringPlace ? (
                        <select
                          value={gatheringPlace}
                          onChange={(e) => {
                            if (e.target.value === "__custom") setCustomGatheringPlace(true);
                            else setGatheringPlace(e.target.value);
                          }}
                          className="w-full p-2 rounded text-black"
                        >
                          <option value="">Kies verzamelplaats</option>
                          <option value="Parking KVE">Parking KVE</option>
                          <option value="__custom">Andere (manueel invullen)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={gatheringPlace}
                          onChange={(e) => setGatheringPlace(e.target.value)}
                          className="w-full p-2 rounded text-black"
                          placeholder="Geef verzamelplaats op"
                          onBlur={() => { if (!gatheringPlace) setCustomGatheringPlace(false); }}
                        />
                      )}
                    </div>
                  </li>
                </>
              )}

              <li>
                <label className="block font-semibold mb-1 text-blue-800">Opmerking (algemeen)</label>
                <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} className="w-full p-2 rounded text-black" />
              </li>
            </ul>
          </div>

          {/* Keepers eerst */}
          <div className="mb-6">
            <h3 className="font-bold text-lg text-blue-900 mb-2">Keepers</h3>
            <div className="rounded-xl bg-blue-50 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Selecteer</th>
                    <th className="p-2 text-left">Naam keeper</th>
                    <th className="p-2 text-left">Reden niet geselecteerd & opmerking</th>
                  </tr>
                </thead>
                <tbody>
                  {availableKeepers.map((keeper: string) => (
                    <tr key={keeper}>
                      <td className="p-2">
                        <input
                          type="checkbox"
                          className="w-6 h-6"
                          checked={false}
                          onChange={() => handleSelect(keeper)}
                          aria-label={`Selecteer ${keeper}`}
                        />
                      </td>
                      <td className="p-2">
                        <span className={keeper.toLowerCase().includes(searchSelect.toLowerCase()) && searchSelect ? "bg-yellow-200 px-1 rounded" : ""}>
                          {keeper}
                        </span>
                      </td>
                      <td className="p-2">
                        <select
                          className="w-full text-black"
                          value={nonSelectedReasons[keeper] || ""}
                          onChange={(e) => handleNonSelectedReason(keeper, e.target.value)}
                        >
                          <option value=""> Reden niet geselecteerd</option>
                          {nonSelectionReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input
                          type="text"
                          className="w-full mt-1 p-1 rounded text-black"
                          placeholder="Extra opmerking (optioneel)"
                          value={nonSelectedComments[keeper] || ""}
                          onChange={(e) => handleNonSelectedComment(keeper, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Veldspelers sectie */}
          <div className="mb-2 text-lg text-blue-900">
            Geselecteerd: <span className="font-bold">{selected.length}</span> / {maxSpelers}
            {selected.length > maxSpelers &&
              <span className="ml-2 px-2 py-1 rounded bg-yellow-300 text-yellow-900 font-bold animate-bounce">⚠️ Meer dan {maxSpelers.toString()} geselecteerd!</span>
            }
          </div>

          {selected.length > 0 && (
            <div className={`mb-2 px-2 py-1 rounded font-bold ${alleRugnummersUniek ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900 animate-pulse'}`}>
              {alleRugnummersUniek ? '✅ Alle rugnummers zijn uniek' : '❌ Er zijn dubbele of ontbrekende rugnummers'}
            </div>
          )}

          <button className="font-bold mb-2 px-2 py-1 bg-blue-700 hover:bg-blue-900 rounded text-white transition-all"
            onClick={() => setShowSelection((s) => !s)}>
            {showSelection ? "▼" : "►"} Selectie ({selected.length})
          </button>

          {showSelection && (
            <div className="mb-6">
              <div className="mb-2 flex flex-col md:flex-row gap-2 items-center">
                <input
                  type="text"
                  className="p-2 rounded text-black w-40"
                  placeholder="Zoek rugnummer..."
                  value={searchRugnummer}
                  onChange={(e) => setSearchRugnummer(e.target.value)}
                />
                <button
                  onClick={autoToewijzen}
                  className="bg-blue-600 text-white px-3 py-2 rounded ml-2 font-bold hover:bg-blue-900 transition-all"
                >
                  Vul rugnummers op volgorde
                </button>
              </div>

              <div className="rounded-xl bg-green-50 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Selectie</th>
                      <th className="p-2 text-left">Rugnummer</th>
                      <th className="p-2 text-left">Naam speler</th>
                      <th className="p-2 text-left">Verantwoordelijk</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected
                      .filter((player: string) =>
                        !searchRugnummer.trim() || (selectedPlayers[player] && selectedPlayers[player]!.includes(searchRugnummer))
                      )
                      .map((player: string) => (
                        <tr key={player} className={`transition-all ${responsible === player ? "bg-green-200" : "hover:bg-green-100"}`}>
                          <td className="p-2">
                            <input
                              type="checkbox"
                              className="w-6 h-6"
                              checked={true}
                              onChange={() => removeSelected(player)}
                              aria-label={`Verwijder ${player} uit selectie`}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              className="w-14 text-black"
                              value={selectedPlayers[player] || ""}
                              onChange={(e) => handleRugnummer(player, e.target.value)}
                            >
                              <option value="">--</option>
                              {jerseyNumbers.map((n: number) => {
                                const val = n.toString();
                                const disabled = usedNumbers.has(val) && selectedPlayers[player] !== val;
                                return (
                                  <option key={n} value={val} disabled={disabled}>{n}</option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="p-2">{player}</td>
                          <td className="p-2 text-center">
                            <input
                              type="radio"
                              name="verantwoordelijke"
                              checked={responsible === player}
                              onChange={() => handleResponsible(player)}
                            />
                            {responsible === player && (
                              <span className="ml-2">✅ Verantwoordelijk voor was, fruit & chocomelk</span>
                            )}
                          </td>
                          <td className="p-2"></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button className="font-bold mb-2 px-2 py-1 bg-red-700 hover:bg-red-900 rounded text-white transition-all"
            onClick={() => setShowNotSelected((s) => !s)}>
            {showNotSelected ? "▼" : "►"} Niet-geselecteerden ({sortedNotSelected.length})
          </button>

          {showNotSelected && (
            <div className="mb-10">
              <h3 className="font-semibold mb-1 text-blue-900">Zoek en selecteer spelers</h3>
              <input
                type="text"
                placeholder="Zoek speler..."
                value={searchSelect}
                onChange={(e) => setSearchSelect(e.target.value)}
                className="p-2 rounded text-black w-full mb-2"
                autoComplete="off"
              />
              <div className="rounded-xl bg-red-50 overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Selecteer</th>
                      <th className="p-2 text-left">Naam speler</th>
                      <th className="p-2 text-left">Reden niet geselecteerd & Opmerking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNotSelected.map((player: string) => (
                      <tr key={player}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            className="w-6 h-6"
                            checked={false}
                            onChange={() => handleSelect(player)}
                            aria-label={`Selecteer ${player}`}
                          />
                        </td>
                        <td className="p-2">
                          <span className={player.toLowerCase().includes(searchSelect.toLowerCase()) && searchSelect ? "bg-yellow-200 px-1 rounded" : ""}>
                            {player}
                          </span>
                        </td>
                        <td className="p-2">
                          <select
                            className="w-full text-black"
                            value={nonSelectedReasons[player] || ""}
                            onChange={(e) => handleNonSelectedReason(player, e.target.value)}
                          >
                            <option value="">Reden niet geselecteerd</option>
                            {nonSelectionReasons.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <input
                            type="text"
                            className="w-full mt-1 p-1 rounded text-black"
                            placeholder="Extra opmerking (optioneel)"
                            value={nonSelectedComments[player] || ""}
                            onChange={(e) => handleNonSelectedComment(player, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selected.some((p) => !selectedPlayers[p]) && (
            <p className="text-yellow-400 font-semibold mb-2 animate-pulse">⚠️ Sommige spelers hebben nog geen rugnummer!</p>
          )}
        </div>

        {/* RECHTS: LIVE PREVIEW */}
        <div className="w-full md:w-1/2 p-2 md:pr-8 pt-7 flex flex-col">
          <div className="bg-white text-black p-4 rounded-2xl shadow-xl border border-blue-200"
               style={{ minHeight: 420, transition: "box-shadow 0.33s" }}>
            <div id="mailpreview-only" dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        </div>
      </div>

      {/* Sticky kopieerknop */}
      {teamId && <FloatingCopyButton onClick={copyToClipboard} success={success} />}

      {/* Extra CSS */}
      <style>{`
        @keyframes watermark-fade {
          0% { opacity: 0.13; }
          50% { opacity: 0.44; }
          100% { opacity: 0.13; }
        }
        .shadow-xl { box-shadow: 0 8px 32px #2166aa18, 0 2px 16px #284cff17 !important; }
        .rounded-2xl { border-radius: 18px !important; }
        button[aria-label="Kopieer e-mail"] { animation: ${success ? "copy-pulse 1.2s" : "none"}; }
        @keyframes copy-pulse {
          0% { box-shadow: 0 0 0 0 #4ec5fc66; }
          70% { box-shadow: 0 0 0 10px #4ec5fc00; }
          100% { box-shadow: 0 0 0 0 #4ec5fc00; }
        }
        button, select, input[type="button"], input[type="submit"] { transition: box-shadow 0.15s, background 0.17s; }
        button:hover:not(:disabled) { box-shadow: 0 2px 10px #1469a155 !important; background: #1c58b022 !important; }
      `}</style>
    </>
  );
}
