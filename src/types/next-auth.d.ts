import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      warehouseId: string | null;
      regionId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    warehouseId: string | null;
    regionId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    warehouseId: string | null;
    regionId: string | null;
  }
}
