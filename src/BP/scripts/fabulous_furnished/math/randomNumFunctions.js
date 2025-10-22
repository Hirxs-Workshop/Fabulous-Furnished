export function randomWholeNum(min, max) {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);
    return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}
export function randomNum(min, max) {
    return Math.random() * (max - min) + min;
}
