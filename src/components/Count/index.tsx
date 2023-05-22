import { useState } from 'react';

interface Props {
  count: number;
}

const Count = ({ count }: Props) => {
  return (
    <>
      <div>count: {count}</div>
    </>
  );
};

export default Count;
