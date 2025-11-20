"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTelegram } from "../../hooks/useTelegram";

function PDFViewer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { webApp } = useTelegram();
  const [pdfUrl, setPdfUrl] = useState<string>("");

  useEffect(() => {
    // Get PDF URL from query parameter
    const url = searchParams.get("url");
    if (url) {
      setPdfUrl(decodeURIComponent(url));
    }
  }, [searchParams]);

  // Set up back button
  useEffect(() => {
    if (webApp) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(() => {
        router.back();
      });
    }

    return () => {
      if (webApp) {
        webApp.BackButton.hide();
      }
    };
  }, [webApp, router]);

  if (!pdfUrl) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center w-full h-full"
        style={{
          backgroundImage: "url(/bg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="font-rubik text-[#1C1C1E]">Загрузка PDF...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title="PDF Viewer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

export default function PDFViewerPage() {
  return (
    <Suspense fallback={
      <div 
        className="fixed inset-0 flex items-center justify-center w-full h-full"
        style={{
          backgroundImage: "url(/bg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="font-rubik text-[#1C1C1E]">Загрузка...</p>
      </div>
    }>
      <PDFViewer />
    </Suspense>
  );
}

