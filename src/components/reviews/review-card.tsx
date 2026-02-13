"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { StarRating } from "./star-rating";

interface ReviewPhoto {
  id: number;
  imageUrl: string;
  thumbnailUrl?: string | null;
}

interface ReviewCardProps {
  review: {
    id: number;
    userName: string | null;
    dishName: string | null;
    rating: number;
    comment?: string | null;
    createdAt: string;
    photos: ReviewPhoto[];
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const time = new Date(review.createdAt).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{review.dishName}</p>
          <p className="text-xs text-muted-foreground">by {review.userName} &middot; {time}</p>
        </div>
        <StarRating rating={review.rating} readonly size={14} />
      </div>

      {review.comment && (
        <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
      )}

      {review.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.photos.map((photo) => (
            <div key={photo.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={photo.thumbnailUrl || photo.imageUrl}
                alt="Review photo"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
