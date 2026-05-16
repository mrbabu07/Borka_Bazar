"use client";

import dynamic from "next/dynamic";

const ClientApp = dynamic(() => import("../App.jsx"), {
  ssr: false,
  loading: () => null,
});

export default ClientApp;
