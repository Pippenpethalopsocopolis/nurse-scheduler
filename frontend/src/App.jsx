import { useState } from "react";

function App() {
	const [schedule, setSchedule] = useState([]);

	const nurses = [
		{ id: 1, name: "Ayşe" },
		{ id: 2, name: "Mehmet" },
		{ id: 3, name: "Ela" },
		{ id: 4, name: "Ahmet" },
		{ id: 5, name: "Berk" },
		{ id: 6, name: "Eren" },
		{ id: 7, name: "Yakut" },
		{ id: 8, name: "Elif" },
		{ id: 9, name: "Gani" }
	];

	const generate = async () => {
		const res = await fetch("http://localhost:3001/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				nurses,
				days: 7,
				shifts: ["Sabah", "Akşam", "Gece"]
			})
		});

		const data = await res.json();
		setSchedule(data.schedule);
	};

	const getNurseName = (id) => {
		return nurses.find(n => n.id === id)?.name || "Unknown";
	};

	return (
		<div>
			<h1>Hemşire Çizelgeleme (GA)</h1>
			<button onClick={generate}>Çizelge Oluştur</button>

			{schedule.map((day, i) => (
				<div key={i}>
					Gün {i + 1}:{" "}
					{day.map(id => getNurseName(id)).join(", ")}
				</div>
			))}
		</div>
	);
}

export default App;