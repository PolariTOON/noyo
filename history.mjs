const ownCaches = new WeakMap();
const toAsync = async (tasks, task, ...options) => {
	return new Promise((resolve, reject) => {
		tasks.push([(...options) => {
			try {
				resolve(task(...options));
			} catch (error) {
				reject(error);
			}
		}, ...options]);
	});
};
const History = class History {
	constructor(tasks, push, pop, measure) {
		const ownCache = {};
		ownCaches.set(this, ownCache);
		ownCache.tasks = tasks;
		ownCache.push = push;
		ownCache.pop = pop;
		ownCache.measure = measure;
	}
	get delta() {
		const ownCache = ownCaches.get(this);
		return ownCache.measure();
	}
	async push(state, ...options) {
		const ownCache = ownCaches.get(this);
		return toAsync(ownCache.tasks, ownCache.push, state, options);
	}
	async pop(...options) {
		const ownCache = ownCaches.get(this);
		return toAsync(ownCache.tasks, ownCache.pop, options);
	}
};
export default History;
