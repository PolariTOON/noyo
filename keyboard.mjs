import {emulateGamepadButton, emulateGamepad} from "./gamepad.mjs";
const isNonNullObject = (object) => {
	return typeof object === "function" || (typeof object === "object" && object !== null);
};
const buttonCount = 17;
let keyboardGamepad;
let keyboardMapping;
const getKeyboard = function getKeyboard(mapping) {
	if (isNonNullObject(mapping)) {
		keyboardMapping = mapping;
	} else if (keyboardMapping === undefined) {
		keyboardMapping = {};
	}
	if (keyboardGamepad === undefined) {
		const indexes = new Map();
		const codes = Array.from({length: buttonCount}, () => {
			return new Set();
		});
		const states = Array.from({length: buttonCount}, () => {
			return false;
		});
		const lastStates = [...states];
		const statesHaveChanged = Array.from({length: buttonCount}, () => {
			return false;
		});
		const buttons = Object.freeze(Array.from({length: buttonCount}, (item, index) => {
			return emulateGamepadButton({
				get pressed() {
					if (keyboardGamepad.connected && statesHaveChanged[index]) {
						lastStates[index] = states[index];
					}
					return lastStates[index];
				},
				get touched() {
					if (keyboardGamepad.connected && statesHaveChanged[index]) {
						lastStates[index] = states[index];
					}
					return lastStates[index];
				},
				get value() {
					if (keyboardGamepad.connected && statesHaveChanged[index]) {
						lastStates[index] = states[index];
					}
					return Number(lastStates[index]);
				}
			});
		}));
		let lastButtons = buttons;
		let buttonsHaveChanged = false;
		let timestamp = performance.now();
		let lastTimestamp = timestamp;
		let timestampHasChanged = false;
		keyboardGamepad = emulateGamepad({
			id: "Keyboard",
			axes: Object.freeze([]),
			get buttons() {
				if (keyboardGamepad.connected && buttonsHaveChanged) {
					lastButtons = Object.freeze([...buttons]);
				}
				return lastButtons;
			},
			get timestamp() {
				if (keyboardGamepad.connected && timestampHasChanged) {
					lastTimestamp = timestamp;
				}
				return lastTimestamp;
			},
			connected: true
		});
		addEventListener("keydown", (event) => {
			if (Reflect.has(keyboardMapping, event.code)) {
				const index = Reflect.get(keyboardMapping, event.code, keyboardMapping);
				if (typeof index === "number" && Number.isInteger(index) && index >= 0 && index < buttonCount) {
					buttonsHaveChanged = true;
					timestampHasChanged = true;
					timestamp = performance.now();
					if (indexes.has(event.code)) {
						codes[indexes.get(event.code)].delete(event.code);
					}
					codes[index].add(event.code);
					if (codes[index].size !== 0 && !states[index]) {
						statesHaveChanged[index] = true;
						states[index] = true;
					}
					indexes.set(event.code, index);
				}
			}
		});
		addEventListener("keyup", (event) => {
			if (indexes.has(event.code)) {
				const index = indexes.get(event.code);
				buttonsHaveChanged = true;
				timestampHasChanged = true;
				timestamp = performance.now();
				codes[index].delete(event.code);
				if (codes[index].size === 0 && states[index]) {
					statesHaveChanged[index] = true;
					states[index] = false;
				}
				indexes.delete(event.code);
			}
		});
	}
	return keyboardGamepad;
};
export {getKeyboard};
export default {getKeyboard};
