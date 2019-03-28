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
const Timeline = class Timeline {
	constructor(stack, goTo, goBack, getDelta) {
		const ownCache = {};
		ownCaches.set(this, ownCache);
		ownCache.stack = stack;
		ownCache.goTo = goTo;
		ownCache.goBack = goBack;
		ownCache.getDelta = getDelta;
	}
	get delta() {
		const ownCache = ownCaches.get(this);
		return ownCache.getDelta();
	}
	goTo(state, ...options) {
		const ownCache = ownCaches.get(this);
		ownCache.goTo(ownCache.stack, state, options);
		// return toAsync(ownCache.tasks, ownCache.goTo, state, options);
	}
	goBack(...options) {
		const ownCache = ownCaches.get(this);
		ownCache.goBack(ownCache.stack, options);
		// return toAsync(ownCache.tasks, ownCache.goBack, options);
	}
};
export default Timeline;
