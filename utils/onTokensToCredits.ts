
export const onTokensToCredits = (tokens: number): number => {
    return Math.ceil(tokens / 1000); // 1 crédito por cada 1000 tokens
};
