import { getAllModules } from "@/actions/module-actions";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainCanva } from "./_components";

const CanvaPage = async () => {
    const user = await currentUser();


    if (!user) {
        redirect("/login");
    }

    const { data: modules } = await getAllModules();

    if(!modules) return 'No se encontraron módulos'

    return <MainCanva modules={modules} />;
};

export default CanvaPage;