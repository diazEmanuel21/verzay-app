import { CreditMain } from "./_components";

interface Props {
  searchParams: {
    userId?: string;
  };
}

const CreditPage = ({ searchParams }: Props) => {
  const userId = searchParams.userId;

  if (!userId) {
    return <p className="text-red-500">Error: userId no proporcionado</p>;
  }

  return <CreditMain userId={userId} />;
};

export default CreditPage;
