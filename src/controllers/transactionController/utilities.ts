export const arrangeTransactionDetails = async ( transactions:any, userId:number) => {

    let balance = 0
    const receive = {
        from:{
            agent: 0,
            win: 0,
        },
        total: 0
    }
    const lose = {
        from:{
            transfer: 0,
            bet: 0,
            charge: 0,
        },
        total: 0
    }
    

    const details:any = transactions.map((transaction:any) => {

        const data:any = {};
        const { id, type, amount, status, createdAt, updatedUser, sender, receiver, gameId } = transaction
 
        data.id = id
        data.type = type
        data.status = status
        data.createdAt = createdAt
        data.refererId = updatedUser
        data.before = 0

        if(sender?.id == userId && sender?.type == "agent") {
            data.user = {
                id: sender.id,
                name: sender.username,
                type: sender.type,
            }

            if(transaction.type == "add") {
                data.amount = -parseFloat(amount)
                data.action = "adds to"
                data.receiver = {
                    id: receiver.id,
                    name: receiver.username,
                    type: receiver.type
                }
                // Agents transfer -> money out
                lose.from.transfer +=data.amount
            }

            if(data.amount >=0 ) {
receive.total += data.amount
} else {
lose.total += data.amount
}
        } else if(receiver?.id == userId && receiver?.type == "agent") {
            data.user = {
                id: receiver.id,
                name: receiver.username,
                type: receiver.type,
            }

            if(transaction.type == "add") {
                data.amount = parseFloat(amount)
                data.action = "received from"
                data.sender = {
                    id: sender.id,
                    name: sender.username,
                    type: sender.type
                }
                // Agents transfer -> money out
                receive.from.agent += data.amount
            }

            if(data.amount >=0 ) {
receive.total += data.amount
} else {
lose.total += data.amount
}
        } else if(receiver?.id == userId && receiver?.type == "player" && sender?.type == "agent") {
            data.user = {
                id: receiver.id,
                name: receiver.username,
                type: receiver.type,
            }

            if(transaction.type == "add") {
                data.amount = parseFloat(amount)
                data.action = "received from"
                data.sender = {
                    id: sender.id,
                    name: sender.username,
                    type: sender.type
                }
                // Agents transfer -> money out
                receive.from.agent += data.amount
            }

            if(data.amount >=0 ) {
receive.total += data.amount
} else {
lose.total += data.amount
}
        } else if(receiver?.id == userId && receiver?.type == "player" && gameId != null) {
            data.user = {
                id: receiver.id,
                name: receiver.username,
                type: receiver.type,
            }

            if(transaction.type == "win") {
                data.amount = parseFloat(amount)
                data.action = "wins on"
                data.details = {
                    game: {
                        id: gameId,
                        type: "baccarat",
                        round: 0,
                        title: "Speed Baccarat J",
                        vendor: "evolution", 
                    }
                }
                // Agents transfer -> money out
                receive.from.win += data.amount
            } else if(transaction?.type == "charge" || transaction?.type == "lose") { // LOSE
                data.amount = -parseFloat(amount)
                data.action = "lost and charged from"
                data.details = {
                    game: {
                        id: gameId,
                        type: "baccarat",
                        round: 0,
                        title: "Speed Baccarat J",
                        vendor: "evolution", 
                    }
                }
                // Agents transfer -> money out
                lose.from.charge += data.amount
            }

            if(data.amount >=0 ) {
receive.total += data.amount
} else {
lose.total += data.amount
}
        } else if(sender?.id == userId && sender?.type == "player" && gameId != null) {
            data.user = {
                id: sender.id,
                name: sender.username,
                type: sender.type,
            }

            if(transaction.type == "bet") {
                data.amount = -parseFloat(amount)
                data.action = "bets on"
                data.details = {
                    game: {
                        id: gameId,
                        type: "baccarat",
                        round: 0,
                        title: "Speed Baccarat J",
                        vendor: "evolution", 
                    }
                }
                // Agents transfer -> money out
                lose.from.bet +=data.amount
            }

            if(data.amount >=0 ) {
receive.total += data.amount
} else {
lose.total += data.amount
}
        } else {
            data.error = { message: "error" }
        }
        balance += data.amount
        return data
    })  

    return {details, receive, lose, balance}
}