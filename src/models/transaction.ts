export interface Transaction {
  type: string;
  note: string;
  token: string;
  status: string;
  amount: number;
  gameId: string;
  sender?: { connect: { id: number } };
  receiver?: { connect: { id: number } };
  currency?: { connect: { id: number } };
  updatedUser?: { connect: { id: number } };
}
