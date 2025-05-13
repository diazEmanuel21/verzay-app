
export const onTokensToCredits = (tokens: number): number => {
    return Math.ceil(tokens / 30848); // 1 crédito por cada 1000 tokens
};
