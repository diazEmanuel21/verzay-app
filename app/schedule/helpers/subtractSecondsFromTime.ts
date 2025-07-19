export const subtractSecondsFromTime = (timeStr: string, seconds: number): string => {
    const date = new Date(timeStr);
    const newDate = new Date(date.getTime() - seconds * 1000);
    return newDate.toISOString();
}
