import { Collection } from "@/components/shared/Collection"
import { navLinks } from "@/constants"
import Image from "next/image"
import Link from "next/link"

const Home = async ({ searchParams }: SearchParamProps) => {
  const page = Number(searchParams?.page) || 1;
  const searchQuery = (searchParams?.query as string) || '';
  const totalPages = 3;

  const videos = [
    {
      id: "Gp5e6tSuocQ",
      title: "Cómo automatizar ventas con Verzay IA",
      thumbnail: "https://i.ytimg.com/vi/CG8Cr-MLb0Y/hqdefault.jpg?sqp=-oaymwEnCPYBEIoBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLDFc6AwUUrhJCmvzqFquVIxMcvP7A",
    },
    {
      id: "chRT9GU4GVM",
      title: "Guía completa para crear agentes IA en Verzay",
      thumbnail: "https://i.ytimg.com/vi/zYipcQaELNs/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLAA-lZve_PeENpK2d-D3-7Gr7ZITw",
    },
    {
      id: "V1wC9B2ccrY",
      title: "Integración de IA Verzay con WhatsApp",
      thumbnail: "https://i.ytimg.com/vi/WmRabPTAdRk/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCpsukDTz5BeHJH1podPYAcXwhgQw",
    },
  ];

  return (
    <>
      <section className="home">
        <h1 className="home-heading">
          Entrena tu IA para que sea tu mejor aliado
        </h1>
        <ul className="flex-center w-full gap-20">
          {navLinks.slice(1, 5).map((link) => (
            <Link
              key={link.route}
              href={link.route}
              className="flex-center flex-col gap-2"
            >
              <li className="flex-center w-fit rounded-full bg-white p-4">
                <Image src={link.icon} alt="image" width={24} height={24} />
              </li>
              <p className="p-14-medium text-center text-white">{link.label}</p>
            </Link>
          ))}
        </ul>
      </section>

      <section className="sm:mt-12">
        <Collection
          videos={videos}
          page={page}
          hasSearch={true}
        />
      </section>
    </>
  )
}

export default Home