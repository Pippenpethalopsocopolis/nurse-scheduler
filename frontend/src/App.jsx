import { useState } from "react";
import "./App.css";

const NURSES = [
	{ id: 1, name: "Ayşe" },
	{ id: 2, name: "Mehmet" },
	{ id: 3, name: "Ela" },
	{ id: 4, name: "Ahmet" },
	{ id: 5, name: "Berk" },
	{ id: 6, name: "Eren" },
	{ id: 7, name: "Yakut" },
	{ id: 8, name: "Elif" },
	{ id: 9, name: "Gani" },
];

const SHIFTS = ["Sabah", "Akşam", "Gece"];

const SHIFT_COLORS = {
	Sabah: { bg: "#FFF3CD", border: "#F0C040", text: "#7A5C00", dot: "#F0C040" },
	Akşam: { bg: "#D4EDDA", border: "#5BA370", text: "#1A4A2A", dot: "#5BA370" },
	Gece: { bg: "#D6E4FF", border: "#5580D0", text: "#1A2E6A", dot: "#5580D0" },
};

const NURSE_PALETTE = [
	"#E57373", "#64B5F6", "#81C784", "#FFD54F",
	"#BA68C8", "#4DB6AC", "#FF8A65", "#90A4AE", "#F06292",
];

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
	"Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
	"Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

function getDaysInMonth(year, month) {
	return new Date(year, month + 1, 0).getDate();
}
// 0=Sun,1=Mon,...,6=Sat → convert to Mon-first index
function getFirstDayOfWeek(year, month) {
	const d = new Date(year, month, 1).getDay();
	return (d + 6) % 7; // Mon=0 … Sun=6
}

export default function App() {
	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth());
	const [schedule, setSchedule] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selected, setSelected] = useState(null); // {day, shifts:[]}

	const daysInMonth = getDaysInMonth(year, month);

	const generate = async () => {
		setLoading(true);
		setError(null);
		setSelected(null);
		try {
			const res = await fetch("http://localhost:3001/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nurses: NURSES, days: daysInMonth, shifts: SHIFTS }),
			});
			const data = await res.json();
			setSchedule(data.schedule);
		} catch (e) {
			setError("Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun.");
		} finally {
			setLoading(false);
		}
	};

	const prevMonth = () => {
		if (month === 0) { setYear(y => y - 1); setMonth(11); }
		else setMonth(m => m - 1);
		setSchedule([]); setSelected(null);
	};
	const nextMonth = () => {
		if (month === 11) { setYear(y => y + 1); setMonth(0); }
		else setMonth(m => m + 1);
		setSchedule([]); setSelected(null);
	};

	const nurseColor = (id) => NURSE_PALETTE[(id - 1) % NURSE_PALETTE.length];
	const nurseName = (id) => NURSES.find(n => n.id === id)?.name || "?";

	// Shift counts per nurse
	const shiftCounts = {};
	NURSES.forEach(n => { shiftCounts[n.id] = { total: 0, Sabah: 0, Akşam: 0, Gece: 0 }; });
	schedule.forEach(day => {
		SHIFTS.forEach((sh, si) => {
			const id = day[si];
			if (id && shiftCounts[id]) {
				shiftCounts[id].total++;
				shiftCounts[id][sh]++;
			}
		});
	});

	const firstDow = getFirstDayOfWeek(year, month); // blanks before day 1

	return (
		<div className="root">
			{/* ── Header ── */}
			<header className="header">
				<div className="header-left">
					<span className="logo">🏥</span>
					<div>
						<div className="title">Hemşire Çizelgesi</div>
						<div className="subtitle">Genetik Algoritma ile Otomatik Planlama</div>
					</div>
				</div>
				<div className="header-right">
					<button className="nav-btn" onClick={prevMonth}>‹</button>
					<div className="month-label">{MONTH_NAMES[month]} {year}</div>
					<button className="nav-btn" onClick={nextMonth}>›</button>
					<button
						className="generate-btn"
						onClick={generate}
						disabled={loading}
					>
						{loading ? "Hesaplanıyor…" : "Çizelge Oluştur"}
					</button>
				</div>
			</header>

			{error && <div className="error">{error}</div>}

			<div className="body">
				{/* ── Calendar ── */}
				<div className="cal-wrap">
					<div className="cal-grid">
						{/* Day-of-week headers */}
						{DAY_NAMES.map(d => (
							<div key={d} className="dow-header">{d}</div>
						))}
						{/* Blank cells */}
						{Array.from({ length: firstDow }).map((_, i) => (
							<div key={`blank-${i}`} className="blank-cell" />
						))}
						{/* Day cells */}
						{Array.from({ length: daysInMonth }).map((_, i) => {
							const dayIdx = i;
							const dayShifts = schedule[dayIdx];
							const isSelected = selected?.day === i;
							return (
								<div
									key={i}
									className={[
										"cell",
										dayShifts ? "cell-filled" : "",
										isSelected ? "cell-selected" : "",
									].join(" ").trim()}
									onClick={() => dayShifts && setSelected(isSelected ? null : { day: i, shifts: dayShifts })}
								>
									<div className="cell-day">{i + 1}</div>
									{dayShifts && (
										<div className="shift-dots">
											{SHIFTS.map((sh, si) => {
												const nid = dayShifts[si];
												return (
													<div key={sh} className="dot-row">
														<span className="shift-dot" style={{ background: SHIFT_COLORS[sh].dot }} />
														<span className="dot-name" style={{ color: nurseColor(nid) }}>
															{nurseName(nid)}
														</span>
													</div>
												);
											})}
										</div>
									)}
									{!dayShifts && <div className="empty-hint">—</div>}
								</div>
							);
						})}
					</div>
				</div>

				{/* ── Side panel ── */}
				<div className="side">
					{/* Detail card */}
					{selected && (
						<div className="detail-card">
							<div className="detail-title">
								{MONTH_NAMES[month]} {selected.day + 1}, {year}
							</div>
							{SHIFTS.map((sh, si) => {
								const nid = selected.shifts[si];
								const col = SHIFT_COLORS[sh];
								return (
									<div
										key={sh}
										className="shift-row"
										style={{ background: col.bg, borderLeft: `3px solid ${col.border}` }}
									>
										<span className="shift-label" style={{ color: col.text }}>{sh}</span>
										<span className="shift-nurse" style={{ color: nurseColor(nid) }}>
											{nurseName(nid)}
										</span>
									</div>
								);
							})}
						</div>
					)}

					{/* Nurse summary */}
					{schedule.length > 0 && (
						<div className="summary-card">
							<div className="summary-title">Vardiya Dağılımı</div>
							<div className="legend">
								{SHIFTS.map(sh => (
									<span key={sh} className="legend-item">
										<span className="legend-dot" style={{ background: SHIFT_COLORS[sh].dot }} />
										{sh}
									</span>
								))}
							</div>
							{NURSES.map(n => {
								const c = shiftCounts[n.id];
								return (
									<div key={n.id} className="nurse-row">
										<span
											className="nurse-tag"
											style={{
												background: nurseColor(n.id) + "22",
												color: nurseColor(n.id),
												borderColor: nurseColor(n.id),
											}}
										>
											{n.name}
										</span>
										<div className="bars">
											{SHIFTS.map(sh => (
												<div
													key={sh}
													className="bar"
													title={`${sh}: ${c[sh]}`}
													style={{
														width: `${(c[sh] / daysInMonth) * 100}%`,
														background: SHIFT_COLORS[sh].dot,
													}}
												/>
											))}
										</div>
										<span className="total-badge">{c.total}</span>
									</div>
								);
							})}
						</div>
					)}

					{schedule.length === 0 && !loading && (
						<div className="empty-state">
							<div className="empty-icon">📋</div>
							<div className="empty-text">Çizelge oluşturmak için butona tıklayın.</div>
						</div>
					)}
				</div>
			</div>

			{/* ── Footer ── */}
			<div className="footer">
				{SHIFTS.map(sh => (
					<span key={sh} className="footer-item">
						<span className="legend-dot" style={{ background: SHIFT_COLORS[sh].dot }} />
						{sh}
					</span>
				))}
				<span className="footer-stats">
					{schedule.length > 0 && `${daysInMonth} gün · ${NURSES.length} hemşire · ${SHIFTS.length} vardiya`}
				</span>
			</div>
		</div>
	);
}