import React from 'react';

interface HeaderProps {
  titleLine1: string;
  titleLine2: string;
  line1Small?: boolean;
}

const Header: React.FC<HeaderProps> = ({ titleLine1, titleLine2, line1Small = true }) => {
  return (
    <div className="bg-[#013467] text-white px-4 pt-8 pb-5 m-4 text-left shadow-md">
      <div className="flex justify-start items-baseline gap-2">
        <h1 className={`${line1Small ? 'text-base font-normal' : 'text-xl font-semibold'} `}>{titleLine1}</h1>
        <h2 className="text-3xl font-bold">{titleLine2}</h2>
      </div>
    </div>
  );
};

export default Header;