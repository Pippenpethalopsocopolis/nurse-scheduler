function deepCopy(schedule) {
	return schedule.map(day => [...day]);
}

function generateRandomSchedule(nurses, days, shifts) {
	const schedule = [];
	for (let d = 0; d < days; d++) {
		const day = [];
		// Track which nurses are already assigned today to avoid same-day duplicates
		const usedToday = new Set();
		for (let s = 0; s < shifts.length; s++) {
			// Try to pick a nurse not yet used today
			const available = nurses.filter(n => !usedToday.has(n.id));
			const pool = available.length > 0 ? available : nurses;
			const pick = pool[Math.floor(Math.random() * pool.length)];
			day.push(pick.id);
			usedToday.add(pick.id);
		}
		schedule.push(day);
	}
	return schedule;
}

function fitness(schedule, nurses, shifts) {
	let penalty = 0;
	const numShifts = shifts.length;

	// 1. Same nurse twice in one day (hard constraint)
	schedule.forEach(day => {
		const seen = new Set();
		day.forEach(nurseId => {
			if (seen.has(nurseId)) penalty += 20;
			seen.add(nurseId);
		});
	});

	// 2. Consecutive night shifts: heavy penalty if nurse works Gece two nights in a row
	const nightIdx = shifts.indexOf("Gece");
	if (nightIdx !== -1) {
		for (let d = 1; d < schedule.length; d++) {
			if (schedule[d - 1][nightIdx] === schedule[d][nightIdx]) {
				penalty += 15;
			}
		}
	}

	// 3. Fairness: penalise deviation from average total shifts
	const shiftCounts = {};
	nurses.forEach(n => (shiftCounts[n.id] = 0));
	schedule.forEach(day => day.forEach(id => shiftCounts[id]++));

	const counts = Object.values(shiftCounts);
	const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
	counts.forEach(c => {
		penalty += Math.abs(c - avg) * 3;
	});

	// 4. Per-shift fairness: each nurse should share each shift type roughly equally
	const shiftTypeCounts = {};
	nurses.forEach(n => {
		shiftTypeCounts[n.id] = new Array(numShifts).fill(0);
	});
	schedule.forEach(day => {
		day.forEach((nurseId, si) => {
			if (shiftTypeCounts[nurseId]) shiftTypeCounts[nurseId][si]++;
		});
	});

	for (let si = 0; si < numShifts; si++) {
		const typeCounts = nurses.map(n => shiftTypeCounts[n.id][si]);
		const typeAvg = typeCounts.reduce((a, b) => a + b, 0) / typeCounts.length;
		typeCounts.forEach(c => {
			penalty += Math.abs(c - typeAvg) * 2;
		});
	}

	return -penalty;
}

function mutate(schedule, nurses, mutationRate = 0.03) {
	const copy = deepCopy(schedule);
	for (let d = 0; d < copy.length; d++) {
		for (let s = 0; s < copy[d].length; s++) {
			if (Math.random() < mutationRate) {
				copy[d][s] = nurses[Math.floor(Math.random() * nurses.length)].id;
			}
		}
	}
	return copy;
}

function crossover(parent1, parent2) {
	// Two-point crossover for more diversity on longer schedules
	const len = parent1.length;
	const p1 = Math.floor(Math.random() * len);
	const p2 = Math.floor(Math.random() * len);
	const lo = Math.min(p1, p2);
	const hi = Math.max(p1, p2);

	return [
		...parent1.slice(0, lo).map(day => [...day]),
		...parent2.slice(lo, hi).map(day => [...day]),
		...parent1.slice(hi).map(day => [...day]),
	];
}

function tournamentSelect(population, nurses, shifts, k = 3) {
	let best = null;
	let bestFit = -Infinity;
	for (let i = 0; i < k; i++) {
		const candidate = population[Math.floor(Math.random() * population.length)];
		const f = fitness(candidate, nurses, shifts);
		if (f > bestFit) { bestFit = f; best = candidate; }
	}
	return best;
}

export function runGA(
	nurses,
	days,
	shifts,
	popSize = 50,
	generations = 300
) {
	// Seed population with smarter random schedules
	let population = Array.from({ length: popSize }, () =>
		generateRandomSchedule(nurses, days, shifts)
	);

	let bestEver = null;
	let bestEverFit = -Infinity;

	for (let gen = 0; gen < generations; gen++) {
		// Evaluate & sort
		const scored = population.map(ind => ({
			ind,
			fit: fitness(ind, nurses, shifts),
		}));
		scored.sort((a, b) => b.fit - a.fit);

		if (scored[0].fit > bestEverFit) {
			bestEverFit = scored[0].fit;
			bestEver = deepCopy(scored[0].ind);
		}

		population = scored.map(s => s.ind);

		// Elitism: keep top 4
		const newPop = [
			deepCopy(population[0]),
			deepCopy(population[1]),
			deepCopy(population[2]),
			deepCopy(population[3]),
		];

		// Adaptive mutation: increase rate if stagnating
		const mutRate = gen > 200 ? 0.05 : 0.03;

		while (newPop.length < popSize) {
			const parentA = tournamentSelect(population, nurses, shifts);
			const parentB = tournamentSelect(population, nurses, shifts);
			const child = crossover(parentA, parentB);
			newPop.push(mutate(child, nurses, mutRate));
		}

		population = newPop;
	}

	return bestEver || population[0];
}