import History from "./history.mjs";
import State from "./state.mjs";
const trim = /^[\t\f\n\r ]+|[\t\f\n\r ]$/g;
const split = /[\t\f\n\r ]+/g;
const escape = /[^-0-9A-Z_a-z]/g;
const elements = new WeakMap();
const visit = (graph, states, id) => {
	if (states.hasOwnProperty(id)) {
		if (states[id] != null) {
			return states[id];
		} else {
			throw new Error(`${graph} is not directed acyclic`);
		}
	} else {
		states[id] = null;
		const [Class = State, ...options] = graph[id];
		let element = document.querySelector(`:root > body > section#${id.replace(escape, (character) => `\\${character.codePointAt(0).toString(16)}`)}`);
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
			return visit(graph, states, id);
		});
		const state = states[id] = new Class(element, successors, ...options);
		elements.set(state, element);
		return state;
	}
};
const push = (stack, state, options) => {
	const {length} = stack;
	if (length > 0) {
		stack[length - 1].pause(...options);
		elements.get(stack[length - 1]).hidden = true;
	}
	stack.push(state);
	elements.get(state).hidden = false;
	state.play(...options);
};
const pop = (stack, options) => {
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
	const states = {};
	for (const id in graph) {
		visit(graph, states, id);
	}
	const canvas = document.createElement("canvas");
	canvas.width = 1920;
	canvas.height = 1080;
	const context = canvas.getContext("2d");
	const stack = [];
	const inputs = [];
	const tasks = [];
	let duration;
	const measure = () => {
		return duration;
	};
	const history = new History(tasks, push, pop, measure);
	const loop = (delta) => {
		duration = delta;
		const state = stack[stack.length - 1];
		for (let i = 0, l = inputs.length; i < l; ++i) {
			state.listen(inputs.shift());
		}
		state.update(history);
		state.render(context);
		while (tasks.length > 0) {
			const [task, ...options] = tasks.shift();
			task(stack, ...options);
		}
		requestAnimationFrame(loop);
	};
	requestAnimationFrame(() => {
		push(stack, states[entry], []);
		loop(0);
		document.body.prepend(canvas);
		document.addEventListener("keydown", (event) => {
			switch (event.key) {
				case "Escape": {
					tasks.push([pop]);
					break;
				}
				default: {
					inputs.push(event);
				}
			}
		});
	});
};
export default runLoop;
