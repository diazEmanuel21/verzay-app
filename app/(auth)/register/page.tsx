import FormRegister from "@/components/form-register";
import { getCountryCodes } from "@/actions/get-country-action";

const RegisterPage = async () => {
  const countries = await getCountryCodes();
  return <FormRegister countries={countries} />;
};
export default RegisterPage;
