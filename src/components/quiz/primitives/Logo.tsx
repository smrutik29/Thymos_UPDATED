import Image from "next/image";
import clsx from "clsx";
import logo from "@/assets/images/thymos-logo.png";

interface LogoProps {
  variant?: "green" | "white";
}

export function Logo({ variant = "green" }: LogoProps) {
  return (
    <div
      className={clsx(
        "flex h-14 w-14 items-center justify-center overflow-hidden rounded-full",
        variant === "green" ? "bg-card-green" : "bg-white"
      )}
    >
      <Image
        src={logo}
        alt="Thymos Health"
        width={56}
        height={56}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
