const ownCaches = new WeakMap();
const State = class State {
	constructor(element, successors) {
		const ownCache = {};
		ownCaches.set(this, ownCache);
		ownCache.element = element;
		ownCache.successors = successors;
	}
	get element() {
		const ownCache = ownCaches.get(this);
		return ownCache.element;
	}
	get successors() {
		const ownCache = ownCaches.get(this);
		return ownCache.successors;
	}
	play() {}
	pause() {}
	resume() {}
	stop() {}
	render() {}
	listen() {}
	update() {}
};
export default State;
