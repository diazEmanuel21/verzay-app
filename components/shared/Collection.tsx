"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { formUrlQuery } from "@/lib/utils";
import { Button } from "../ui/button";
import { Search } from "./Search";

type IVideo = {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
};

export const Collection = ({
  hasSearch = false,
  videos,
  totalPages = 1,
  page,
}: {
  videos: IVideo[];
  totalPages?: number;
  page: number;
  hasSearch?: boolean;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PAGINATION HANDLER
  const onPageChange = (action: string) => {
    const pageValue = action === "next" ? Number(page) + 1 : Number(page) - 1;

    const newUrl = formUrlQuery({
      searchParams: searchParams.toString(),
      key: "page",
      value: pageValue,
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <>
      <div className="collection-heading">
        <h3 className="h3-bold text-dark-600">Videos</h3>
        {hasSearch && <Search />}
      </div>

      {videos.length > 0 ? (
        <ul className="collection-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard video={video} key={video.id} />
          ))}
        </ul>
      ) : (
        <div className="collection-empty">
          <p className="p-20-semibold">No hay tutoriales aún</p>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-10">
          <PaginationContent className="flex w-full">
            <Button
              disabled={Number(page) <= 1}
              className="collection-btn"
              onClick={() => onPageChange("prev")}
            >
              <PaginationPrevious className="hover:bg-transparent hover:text-white" />
            </Button>

            <p className="flex-center p-16-medium w-fit flex-1">
              {page} / {totalPages}
            </p>

            <Button
              className="button w-32 bg-purple-gradient bg-cover text-white"
              onClick={() => onPageChange("next")}
              disabled={Number(page) >= totalPages}
            >
              <PaginationNext className="hover:bg-transparent hover:text-white" />
            </Button>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

const VideoCard = ({ video }: { video: IVideo }) => {
  return (
    <li>
      <Link
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="collection-card block p-4 bg-white rounded-lg shadow hover:shadow-lg transition"
      >
        <div className="relative w-full h-52 mb-4">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover rounded-md"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col">
          <h3 className="p-20-semibold text-dark-600 mb-2 line-clamp-2">{video.title}</h3>
        </div>
      </Link>
    </li>
  );
};
