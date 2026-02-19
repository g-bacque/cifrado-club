import React from "react";

interface Props {
  title: string;
  tempo: number;
}

const TopBar: React.FC<Props> = ({ title, tempo }) => {
  return (
    <div className="bg-gray-800 text-white p-2 flex justify-between">
      <h1>{title}</h1>
      <span>{tempo} BPM</span>
    </div>
  );
};

export default TopBar;
