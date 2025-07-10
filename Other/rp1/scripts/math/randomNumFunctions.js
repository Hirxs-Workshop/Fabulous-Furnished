export function randomWholeNum(min, max) {
    const maxPlus1 = max + 1;
    let result = Math.random() * (max - min) + min;
    //return a random whole number
    return Math.round(result);
}
export function randomNum(min, max) {
    //return a random number
    return Math.random() * (max - min) + min;
}
