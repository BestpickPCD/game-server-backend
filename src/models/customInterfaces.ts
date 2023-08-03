import { Users, Roles, Agents, Transactions } from '@prisma/client'
import { Request } from 'express'

export interface balanceSummary {
    out?: number | null
    in?: number | null 
    gameOut?: number | null
    balance?: number | null
}

export interface RequestWithUser extends Request {
    user?: Users | null
    balanceSummary?: balanceSummary | null
} 

export interface UserAll extends Users {
    role?: Roles | null
    agent?: Agents | null
}

export interface TransactionAll extends Transactions {
    role?: Roles | null
    agent?: Agents | null
} 

