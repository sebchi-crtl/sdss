import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Providers } from "@/lib/providers";
import UserMenu from "@/components/UserMenu";

export const metadata: Metadata = {
  title: "SDSS — Flood Early Warning",
  description: "Smart Decision Support System for Flood Disaster Warning & Management"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers>
          <div className="mx-auto max-w-7xl p-4 mt-9">
            <header className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold">SDSS</h1>
              <nav className="flex flex-wrap gap-3 text-sm">
                <a className="hover:underline" href="/">Dashboard</a>
                <a className="hover:underline" href="/map">Map</a>
                <a className="hover:underline" href="/nigeria-states">Nigeria States</a>
                <a className="hover:underline" href="/sensors">Sensors</a>
                <a className="hover:underline" href="/alerts">Alerts</a>
                <a className="hover:underline" href="/report">Community Report</a>
                <a className="hover:underline" href="/admin">Admin</a>
              </nav>
              <UserMenu />
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
