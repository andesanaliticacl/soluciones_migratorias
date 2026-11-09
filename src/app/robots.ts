import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/solicitud", "/api"] },
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
