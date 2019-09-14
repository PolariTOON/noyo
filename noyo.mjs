import {getEmulatedGamepads} from "./gamepad.mjs";
import {State} from "./state.mjs";
const visit = (trim, split, escape, elements, graph, states, id) => {
	if (states.hasOwnProperty(id)) {
		if (states[id] != null) {
			return states[id];
		} else {
			throw new Error(`${graph} is not directed acyclic`);
		}
	} else {
		states[id] = null;
		const [Class = State, ...options] = graph[id];
		let element = document.querySelector(`html:root > body > section#${id.replace(escape, (character) => `\\${character.codePointAt(0).toString(16)}`)}`);
		if (!element) {
			element = document.createElement("section");
			element.id = id;
			element.hidden = true;
			document.body.append(element);
		}
		let {successors: successorNames = ""} = element.dataset;
		successorNames = successorNames.replace(trim);
		const successorList = successorNames ? successorNames.split(split) : [];
		const successors = successorList.map((id) => {
			return visit(trim, split, escape, elements, graph, states, id);
		});
		const state = states[id] = new Class(element, successors, ...options);
		elements.set(state, element);
		return state;
	}
};
const push = (elements, stack, state, options) => {
	const {length} = stack;
	if (length > 0) {
		stack[length - 1].pause(...options);
		elements.get(stack[length - 1]).hidden = true;
	}
	stack.push(state);
	elements.get(state).hidden = false;
	state.play(...options);
};
const pop = (elements, stack, options) => {
	const {length} = stack;
	if (length > 1) {
		stack[length - 1].stop(...options);
		elements.get(stack[length - 1]).hidden = true;
		stack.pop();
		elements.get(stack[length - 2]).hidden = false;
		stack[length - 2].resume(...options);
	}
};
const runLoop = (graph, entry) => {
	if (!graph.hasOwnProperty(entry)) {
		throw new Error(`entry not in found in ${graph}`);
	}
	const trim = /^[\t\f\n\r ]+|[\t\f\n\r ]+$/g;
	const split = /[\t\f\n\r ]+/g;
	const escape = /[^-0-9A-Z_a-z]/g;
	const elements = new WeakMap();
	const states = {};
	for (const id in graph) {
		visit(trim, split, escape, elements, graph, states, id);
	}
	const canvas = document.createElement("canvas");
	canvas.width = 1920;
	canvas.height = 1080;
	const canvasContext = canvas.getContext("2d");
	const stack = [];
	let lastTimestamp;
	const loop = (timestamp) => {
		const gamepads = [...navigator.getGamepads()].map((gamepad) => {
			return gamepad !== null && gamepad.connected ? gamepad : null;
		});
		const emulatedGamepads = [...getEmulatedGamepads()];
		const delta = timestamp - lastTimestamp;
		lastTimestamp = timestamp;
		stack[stack.length - 1].listen({
			gamepads,
			emulatedGamepads
		});
		stack[stack.length - 1].update({
			delta,
			goTo(state, ...options) {
				push(elements, stack, state, options);
			},
			goBack(...options) {
				pop(elements, stack, options);
			}
		});
		stack[stack.length - 1].render({
			canvasContext
		});
		requestAnimationFrame(loop);
	};
	requestAnimationFrame((timestamp) => {
		lastTimestamp = timestamp;
		document.body.prepend(canvas);
		push(elements, stack, states[entry], []);
		stack[stack.length - 1].render({
			canvasContext
		});
		requestAnimationFrame(loop);
	});
};
export {runLoop};
export default {runLoop};
