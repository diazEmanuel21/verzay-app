import { User } from "@prisma/client"

interface Props {
    searchParams: { [key: string]: string | undefined },
    user: User
};

export const MainReseller = ({ searchParams, user }: Props) => {
    return (
        <div>MainReseller</div>
    )
}
