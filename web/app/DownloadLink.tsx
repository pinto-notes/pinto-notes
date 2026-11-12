"use client";

import { usePathname } from "next/navigation";
import { MAC_DOWNLOAD_PATH } from "@/lib/downloads";
import { MAC_APP_STORE_URL } from "@/lib/site";

/// The Mac button: Pinto Notes on the Mac App Store, in a new tab (lib/posthog.ts counts it as
/// mac_app_store_clicked). The download itself stays a link away: DirectDownloadLink.
export default function DownloadLink({ className, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...rest} className={className} href={MAC_APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/// Apple's "Download on the Mac App Store" badge, as Apple draws it (public/badges, from Apple's
/// marketing tools): the black one, never changed, at least 40 px tall. The space around it is the
/// layout's (at least a quarter of its height).
export function MacAppStoreBadge({ className, height = 48, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { height?: number }) {
  return (
    <DownloadLink {...rest} className={className}>
      <img src="/badges/mac-app-store-black.svg" alt="Download on the Mac App Store" width={Math.round((height * 156.1) / 40)} height={height}
        style={{ display: "block" }} />
    </DownloadLink>
  );
}

/// The small link under the Mac button: the download, as before the App Store. It goes to /download,
/// which says how to install it; on /download it starts the download (counted, lib/downloads.ts).
export function DirectDownloadLink({ className }: { className?: string }) {
  const path = usePathname();
  return path === "/download"
    ? <a className={className} href={MAC_DOWNLOAD_PATH} download="Pinto-Notes.dmg">or download it directly</a>
    : <a className={className} href="/download">or download it directly</a>;
}
