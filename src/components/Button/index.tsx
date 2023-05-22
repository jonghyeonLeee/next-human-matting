import { useEffect, useState } from 'react';

interface Props {
  count: number;
  handleCount: (count: number) => void;
  changeCountNum: number;
  title: string;
}

const Button = ({ count, handleCount, changeCountNum, title }: Props) => {
  const handleClickBtn = (value: number) => {
    handleCount(count + value);
  };

  return (
    <>
      <button
        onClick={() => {
          handleClickBtn(changeCountNum);
        }}
        style={{ width: 100, height: 100, marginRight: 10 }}
      >
        {title}
      </button>
    </>
  );
};

export default Button;
