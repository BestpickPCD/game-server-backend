type transactionType =
  | 'win'
  | 'bet'
  | 'cancel'
  | 'add'
  | 'charge'
  | 'adjust'
  | 'promo_win'
  | 'exceed_credit';
export const checkTransactionType = (type: transactionType): boolean => {
  const types = [
    'win',
    'bet',
    'cancel',
    'add',
    'charge',
    'adjust',
    'promo_win',
    'exceed_credit'
  ];
  return types.includes(type);
};
