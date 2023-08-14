export interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    password: string;
    type: string;
    roleId?: number
    currencyId?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date | null;
    deletedAt?: Date | null;
}
