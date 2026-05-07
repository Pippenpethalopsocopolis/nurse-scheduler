// Deep copy helper to avoid reference mutations
function deepCopy(schedule) {
	return schedule.map(day => [...day]);
}

function generateRandomSchedule(nurses, days, shifts) {
	const schedule = [];

	for (let d = 0; d < days; d++) {
		const day = [];

		for (let s = 0; s < shifts.length; s++) {
			const randomNurse = nurses[Math.floor(Math.random() * nurses.length)].id;
			day.push(randomNurse);
		}

		schedule.push(day);
	}

	return schedule;
}

function fitness(schedule, nurses) {
	let penalty = 0;

	// Penalty: same nurse assigned twice in one day
	schedule.forEach(day => {
		const seen = new Set();
		day.forEach(nurseId => {
			if (seen.has(nurseId)) penalty += 10;
			seen.add(nurseId);
		});
	});

	// Penalty: unequal shift distribution (fairness)
	// Count how many shifts every nurse is taking and gave penalty to nurses that took too much shifts
	const shiftCounts = {};
	nurses.forEach(n => (shiftCounts[n.id] = 0));
	schedule.forEach(day => day.forEach(nurseId => shiftCounts[nurseId]++));

	const counts = Object.values(shiftCounts);
	const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
	counts.forEach(c => {
		penalty += Math.abs(c - avg) * 2; // penalize deviation from average
	});

	return -penalty;
}

function mutate(schedule, nurses) {
	const copy = deepCopy(schedule);
	const d = Math.floor(Math.random() * copy.length);
	const s = Math.floor(Math.random() * copy[0].length);
	copy[d][s] = nurses[Math.floor(Math.random() * nurses.length)].id;
	return copy;
}

// Deep copies slices so child is independent of parents
function crossover(parent1, parent2) {
	const point = Math.floor(Math.random() * parent1.length);
	return [
		...parent1.slice(0, point).map(day => [...day]),
		...parent2.slice(point).map(day => [...day]),
	];
}

// Pick a random individual from the top half of the population
function selectParent(population) {
	const topHalf = population.slice(0, Math.ceil(population.length / 2));
	return topHalf[Math.floor(Math.random() * topHalf.length)];
}

export function runGA(nurses, days, shifts, popSize = 20, generations = 100) {
	let population = Array.from({ length: popSize }, () =>
		generateRandomSchedule(nurses, days, shifts)
	);

	for (let gen = 0; gen < generations; gen++) {
		// Sort best to worst (fitness closer to 0 is better)
		population.sort((a, b) => fitness(b, nurses) - fitness(a, nurses));

		// Carry top 2 unchanged
		const newPopulation = [deepCopy(population[0]), deepCopy(population[1])];

		while (newPopulation.length < popSize) {
			const parentA = selectParent(population);
			const parentB = selectParent(population);
			const child = crossover(parentA, parentB);
			newPopulation.push(mutate(child, nurses));
		}

		population = newPopulation;
	}

	return population[0];
}