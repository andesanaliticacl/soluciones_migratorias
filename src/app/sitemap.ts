import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const sitio = urlSitio();
  return [{ url: sitio, priority: 1 }, { url: `${sitio}/privacidad` }, { url: `${sitio}/terminos` }];
}
