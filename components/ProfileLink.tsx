"use client";

import { useState } from "react";
import ProfileCard from "./ProfileCard";

export default function ProfileLink({
  userId,
  currentUserId,
  profileComplete,
  children,
  className,
  style,
}: {
  userId: string;
  currentUserId: string | null;
  profileComplete: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`bg-transparent border-none cursor-pointer p-0 text-left ${className || ""}`}
        style={style}
      >
        {children}
      </button>
      {open && (
        <ProfileCard
          userId={userId}
          currentUserId={currentUserId}
          profileComplete={profileComplete}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
