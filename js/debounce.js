export function debounce(callback, delay) {
    let timer;
    const cancel = () => {
        clearTimeout(timer);
        timer = undefined;
    };
    const run = (...args) => {
        cancel();
        timer = setTimeout(() => {
            timer = undefined;
            callback(...args);
        }, delay);
    };
    return Object.assign(run, { cancel });
}
//# sourceMappingURL=debounce.js.map