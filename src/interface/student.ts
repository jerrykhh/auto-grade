export type Student = {
    id: string
    name: string
    email?: string
}

export type StudentKey = keyof Student