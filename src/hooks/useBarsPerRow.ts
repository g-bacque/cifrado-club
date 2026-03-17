import { useEffect, useState } from "react";

export function useBarsPerRow() {
  const getBarsPerRow = () => {
    const width = window.innerWidth;

    if (width < 640) return 1;
    if (width < 1024) return 2;
    return 4;
  };

  const [barsPerRow, setBarsPerRow] = useState(getBarsPerRow);

  useEffect(() => {
    const onResize = () => setBarsPerRow(getBarsPerRow());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return barsPerRow;
}