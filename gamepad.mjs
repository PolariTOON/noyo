const isNonNullObject = (object) => {
	return typeof object === "function" || (typeof object === "object" && object !== null);
};
const GamepadButtonHandler = class GamepadButtonHandler {
	constructor(handler) {
		this.handler = handler;
	}
};
const gamepadButtonHandlers = new WeakMap();
const gamepadButtonPrototypeTarget = GamepadButton.prototype;
const gamepadButtonPrototypeHandler = {
	set(target, key, value, receiver) {
		if (key !== "constructor" && target.hasOwnProperty(key)) {
			return false;
		}
		return Reflect.set(target, key, value, receiver);
	},
	get(target, key, receiver) {
		if (key !== "constructor" && target.hasOwnProperty(key) && gamepadButtonHandlers.has(receiver)) {
			const gamepadButtonHandler = gamepadButtonHandlers.get(receiver);
			const {handler} = gamepadButtonHandler;
			if (Reflect.has(handler, key)) {
				return Reflect.get(handler, key, handler);
			}
			switch (key) {
				case "pressed":
				case "touched": {
					return false;
				}
				case "value": {
					return 0;
				}
				default: {
					return null;
				}
			}
		}
		return Reflect.get(target, key, receiver);
	}
};
const gamepadButtonPrototypeProxy = new Proxy(gamepadButtonPrototypeTarget, gamepadButtonPrototypeHandler);
const gamepadButtonPrototype = {
	setPrototypeOf(target, prototype) {
		if (prototype === gamepadButtonPrototypeTarget) {
			prototype = gamepadButtonPrototypeProxy;
		}
		return Reflect.setPrototypeOf(target, prototype);
	},
	getPrototypeOf(target) {
		const prototype = Reflect.getPrototypeOf(target);
		if (prototype === gamepadButtonPrototypeProxy) {
			return gamepadButtonPrototypeTarget;
		}
		return prototype;
	}
};
const emulateGamepadButton = (handler) => {
	const receiver = new Proxy(Object.create(gamepadButtonPrototypeProxy), gamepadButtonPrototype);
	gamepadButtonHandlers.set(receiver, new GamepadButtonHandler(handler));
	return receiver;
};
const GamepadHandler = class GamepadHandler {
	constructor(handler) {
		this.handler = handler;
		this.index = GamepadHandler.nextIndex--;
		this.connected = false;
	}
};
GamepadHandler.nextIndex = -1;
const gamepadHandlers = new WeakMap();
const gamepadPrototypeTarget = Gamepad.prototype;
const gamepadPrototypeHandler = {
	set(target, key, value, receiver) {
		if (key !== "constructor" && target.hasOwnProperty(key)) {
			return false;
		}
		return Reflect.set(target, key, value, receiver);
	},
	get(target, key, receiver) {
		if (key !== "constructor" && target.hasOwnProperty(key) && gamepadHandlers.has(receiver)) {
			const gamepadHandler = gamepadHandlers.get(receiver);
			switch (key) {
				case "index": {
					return gamepadHandler.index;
				}
				case "connected": {
					return gamepadHandler.connected;
				}
				default: {
					const {handler} = gamepadHandler;
					if (Reflect.has(handler, key)) {
						return Reflect.get(handler, key, handler);
					}
					switch (key) {
						case "displayId":
						case "timestamp": {
							return 0;
						}
						case "hand":
						case "id":
						case "mapping": {
							return "";
						}
						case "axes":
						case "buttons":
						case "hapticActuators":
						case "lightIndicators": {
							return [];
						}
						case "pose":
						case "vibrationActuator": {
							return null;
						}
						default: {
							return null;
						}
					}
				}
			}
		}
		return Reflect.get(target, key, receiver);
	}
};
const gamepadPrototypeProxy = new Proxy(gamepadPrototypeTarget, gamepadPrototypeHandler);
const gamepadHandler = {
	setPrototypeOf(target, prototype) {
		if (prototype === gamepadPrototypeTarget) {
			prototype = gamepadPrototypeProxy;
		}
		return Reflect.setPrototypeOf(target, prototype);
	},
	getPrototypeOf(target) {
		const prototype = Reflect.getPrototypeOf(target);
		if (prototype === gamepadPrototypeProxy) {
			return gamepadPrototypeTarget;
		}
		return prototype;
	}
};
const emulateGamepad = (handler) => {
	if (!isNonNullObject(handler)) {
		handler = {};
	}
	const receiver = new Proxy(Object.create(gamepadPrototypeProxy), gamepadHandler);
	gamepadHandlers.set(receiver, new GamepadHandler(handler));
	return receiver;
};
const isGamepadEmulated = (receiver) => {
	return gamepadHandlers.has(receiver);
};
const isGamepadButtonEmulated = (receiver) => {
	return gamepadButtonHandlers.has(receiver);
};
const emulatedGamepads = [];
const getEmulatedGamepads = () => {
	return [...emulatedGamepads];
};
const connectEmulatedGamepad = (receiver) => {
	if (!gamepadHandlers.has(receiver)) {
		return false;
	}
	const gamepadHandler = gamepadHandlers.get(receiver);
	if (!gamepadHandler.connected) {
		gamepadHandler.connected = true;
		const index = ~gamepadHandler.index;
		if (emulatedGamepads.length <= index) {
			emulatedGamepads.push(...Array.from({
				length: index - emulatedGamepads.length
			}).fill(null), receiver);
		} else {
			emulatedGamepads[index] = receiver;
		}
		const event = new CustomEvent("gamepadconnected", {
			bubbles: true,
			cancelable: true
		});
		event.gamepad = receiver;
		Reflect.setPrototypeOf(event, GamepadEvent.prototype);
		dispatchEvent(event);
		return true;
	}
	return false;
};
const disconnectEmulatedGamepad = (receiver) => {
	if (!gamepadHandlers.has(receiver)) {
		return false;
	}
	const gamepadHandler = gamepadHandlers.get(receiver);
	if (gamepadHandler.connected) {
		gamepadHandler.connected = false;
		const index = ~gamepadHandler.index;
		if (index === emulatedGamepads.length - 1) {
			let i = index - 1;
			while (i >= 0 && emulatedGamepads[i] === null) {
				--i;
			}
			emulatedGamepads.length = i + 1;
		} else {
			emulatedGamepads[index] = null;
		}
		const event = new CustomEvent("gamepaddisconnected", {
			bubbles: true,
			cancelable: true
		});
		event.gamepad = receiver;
		Reflect.setPrototypeOf(event, GamepadEvent.prototype);
		dispatchEvent(event);
		return true;
	}
	return false;
};
export {emulateGamepadButton, isGamepadButtonEmulated, emulateGamepad, isGamepadEmulated, getEmulatedGamepads, connectEmulatedGamepad, disconnectEmulatedGamepad};
export default {emulateGamepadButton, isGamepadButtonEmulated, emulateGamepad, isGamepadEmulated, getEmulatedGamepads, connectEmulatedGamepad, disconnectEmulatedGamepad};
