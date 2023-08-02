export const checkTransactionType = (type: string): boolean => {
    const types = ['win', 'bet', 'cancel', 'add', 'charge', 'adjust', 'promo_win', 'exceed_credit']
    return types.includes(type);
}